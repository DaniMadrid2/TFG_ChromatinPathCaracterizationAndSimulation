import numpy as np
from time import time
from scipy.optimize import minimize
from scipy.ndimage import gaussian_filter1d
import numba
from KDEpy import FFTKDE
from numba import njit, prange  # Add numba imports
from config import KDE_PADDING_PERCENTAGE  # Import the new parameter

### The functions that are used to compute the KL divergence and the Markov test are new implementations

########################################
# Numba-accelerated helper functions
########################################

# f​​τ​ : valores del drift modelado (por ejemplo, estimado por el modelo AFP/Fokker–Planck).
# aτ​ : valores del diffusion modelado.
# fKM, aKM: estimaciones empíricas obtenidas por el método de Kramers–Moyal (momentos observados).
# W0, W1: pesos para ponderar la importancia de cada bin o cada momento.
# V=i∑​[W0​(i)(fτ​(i)−fKM​(i))2+W1​(i)(aτ​(i)−aKM​(i))2]
# es lo mismo que:
# Jm​=i∑​[(m(1)_model​−m(1)_data​)2+(m(2)_model​−m(2)_data​)2]
@numba.njit
def fast_weighted_error(f_tau, a_tau, f_KM, a_KM, W0, W1):
    """
    Compute the weighted squared error between the AFP corrected values and 
    the KM estimates. All arrays are assumed to be 1D and of the same length.
    """
    V = 0.0
    n = f_tau.shape[0]
    for i in range(n):
        diff_f = f_tau[i] - f_KM[i]
        diff_a = a_tau[i] - a_KM[i]
        V += W0[i] * diff_f * diff_f + W1[i] * diff_a * diff_a
    return V

# Calcula los momentos empíricos de Kramers–Moyal a partir de una trayectoria X(t)
# fKM​(x_i​)=⟨Δx∣xi​⟩​/Δt
# aKM​(x_i​)=0.5 * ⟨(Δx)^2∣xi​⟩​/Δt
@numba.njit
def fast_KM_avg(X, bins, stride, dt):
    """
    A Numba-accelerated version of KM_avg with improved edge case handling.
    
    Parameters:
      X     : 1D numpy array (the trajectory)
      bins  : numpy array of bin edges
      stride: integer stride to subsample the trajectory X
      dt    : time step
    
    Returns:
      f_KM : Conditional mean (drift estimate) for each bin
      a_KM : Conditional variance (diffusion estimate) for each bin (scaled by 0.5)
      f_err: Standard error for the drift estimate
      a_err: Standard error for the diffusion estimate
    """
    Y = X[::stride]
    tau = stride * dt
    n_bins = len(bins) - 1
    f_KM = np.full(n_bins, np.nan)
    a_KM = np.full(n_bins, np.nan)
    f_err = np.full(n_bins, np.nan)
    a_err = np.full(n_bins, np.nan)

    # Pre-compute differences
    dY = np.zeros(len(Y)-1)
    dY2 = np.zeros(len(Y)-1)
    for j in range(len(Y)-1):
        dY[j] = (Y[j+1] - Y[j]) / tau
        dY2[j] = (Y[j+1] - Y[j])**2 / tau

    for i in range(n_bins):
        bin_low = bins[i]
        bin_high = bins[i+1]
        bin_center = (bin_low + bin_high) / 2.0
        
        # Count points in bin
        count = 0
        sum_dY = 0.0
        sum_dY2 = 0.0
        sum_dY_sq = 0.0
        sum_dY2_sq = 0.0
        
        for j in range(len(Y)-1):
            val = Y[j]
            if val >= bin_low and val <= bin_high:  # Include points on bin edges
                sum_dY += dY[j]
                sum_dY2 += dY2[j]
                sum_dY_sq += dY[j] * dY[j]
                sum_dY2_sq += dY2[j] * dY2[j]
                count += 1
        
        if count >= 2:  # Require at least 2 points for meaningful statistics
            f_KM[i] = sum_dY / count
            a_KM[i] = 0.5 * (sum_dY2 / count)
            # Standard error calculations
            var_f = (sum_dY_sq / count - (f_KM[i]**2))
            var_a = (sum_dY2_sq / count - (sum_dY2 / count)**2)
            if var_f > 0:
                f_err[i] = np.sqrt(var_f / count)
            if var_a > 0:
                a_err[i] = np.sqrt(var_a / count)

    return f_KM, a_KM, f_err, a_err

########################################
# Original functions
########################################
# modelo simbólico tipo SINDy (Sparse Identification of Nonlinear Dynamics).
# Construye la función de drift o difusión como una combinación lineal de términos base
# Se usa para generar los fτ aτ que luego se comparan con los momentos empíricos.
def sindy_model(Xi, expr_list):
    """Return the symbolic model as a sum of expressions weighted by Xi."""
    return sum([Xi[i] * expr_list[i] for i in range(len(expr_list))])

def ntrapz(I, dx):
    if isinstance(dx, (int, float)) or (hasattr(dx, '__len__') and len(dx)==1):
        return np.trapz(I, dx=dx, axis=0)
    else:
        return np.trapz(ntrapz(I, dx[1:]), dx=dx[0])
    
def kl_divergence(p_in, q_in, dx=1, tol=None):
    if tol is None:
        tol = max(min(p_in.flatten()), min(q_in.flatten()))
    q = q_in.copy()
    p = p_in.copy()
    q[q < tol] = tol
    p[p < tol] = tol
    return ntrapz(p * np.log(p / q), dx)



def kl_divergence_b(p, q, dx=None, tol=1e-6):
    """
    Compute the KL divergence between distributions p and q,
    each an N-dimensional histogram array. If dx is provided,
    we can multiply the sum by the volume element.
    """
    # Ensure normalized
    p_sum = np.sum(p)
    q_sum = np.sum(q)
    if p_sum == 0 or q_sum == 0:
        return np.nan  # or 0, depending on convention

    p = p / p_sum
    q = q / q_sum

    # Mask to avoid log(0)
    mask = (p > tol) & (q > tol)

    # Compute the local contributions
    kl_local = p[mask] * np.log(p[mask] / q[mask])

    kl_val = np.sum(kl_local)
    # Multiply by dx if provided (to approximate the integral)
    if dx is not None:
        if isinstance(dx, (list, tuple, np.ndarray)):
            vol = np.prod(dx)
        else:
            vol = dx
        kl_val *= vol

    return kl_val

    
def KM_avg(X, bins, stride, dt):
    Y = X[::stride]
    tau = stride * dt
    dY = (Y[1:] - Y[:-1]) / tau  # Finite-difference derivative estimate
    dY2 = (Y[1:] - Y[:-1])**2 / tau  # Conditional variance
    
    f_KM = np.zeros(len(bins) - 1)
    a_KM = np.zeros_like(f_KM)
    f_err = np.zeros_like(f_KM)
    a_err = np.zeros_like(f_KM)
    
    for i in range(len(bins) - 1):
        mask = np.nonzero((Y[:-1] > bins[i]) * (Y[:-1] < bins[i+1]))[0]
        if len(mask) > 0:
            f_KM[i] = np.mean(dY[mask])
            a_KM[i] = 0.5 * np.mean(dY2[mask])
            f_err[i] = np.std(dY[mask]) / np.sqrt(len(mask))
            a_err[i] = np.std(dY2[mask]) / np.sqrt(len(mask))
        else:
            f_KM[i] = np.nan
            f_err[i] = np.nan
            a_KM[i] = np.nan
            a_err[i] = np.nan
    return f_KM, a_KM, f_err, a_err

# El AFP (Analytical Finite-time Propagator) es una formulación o modelo que corrige los
# efectos de tiempo finito en la estimación de los coeficientes A(x) y B(x).

# Dado un conjunto de coeficientes “instantáneos” A(x),B(x), calcular los coeficientes “efectivos” 
# fτ(x),aτ(x) que producirían los mismos incrementos estadísticos observados a un paso de tiempo τ

#Matemáticamente, esto significa resolver:

# fτ(x)=1τ∫(x′−x) P(x′,t+τ∣x,t) dx′
# aτ(x)=12τ∫(x′−x)2 P(x′,t+τ∣x,t) dx′
# donde P(x′,t+τ∣x,t) es la solución de la FP durante un tiempo finito τ
# Esto extiende a Fokker-Plank para trabajar con tiempos finitos
# afp.precompute_operator(f_vals, a_vals):
#  -> construye el operador que evoluciona p(x,t) a p(x,t+τ) según el modelo de drift y difusión
# f_tau, a_tau = afp.solve(tau):
#  -> calcula los valores de drift y difusión efectivos observables a paso τ.

#| Aspecto                     | Detalle                                                                                                                                                                |
#| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
#| **Corrección temporal**     | Considera que en tiempos finitos, la difusión “promedia” el drift, lo que introduce sesgos si no se corrige.                                                           |
#| **Linealización local**     | En muchos AFP se linealiza la FP localmente alrededor de cada punto (x), asumiendo que (A(x)) y (B(x)) son casi constantes en un pequeño entorno.                      |
#| **Operador de propagación** | Se construye una matriz exponencial ( e^{L\tau} ), donde (L) es el operador FP discretizado. Esto es lo que permite obtener una propagación analítica o semianalítica. |
#| **Ventaja práctica**        | Permite usar datos muestreados con pasos grandes (por ejemplo, (\tau = 0.1) s o 1 s) sin sesgos en la estimación de drift/diffusión.                                   |
#| **Corrección numérica**     | A menudo se usa junto con métodos de estabilización o regularización, porque el operador exponencial puede amplificar ruido.                                           |
#| **Compatibilidad**          | Puede integrarse con modelos simbólicos (como SINDy) o con librerías polinomiales, porque solo requiere evaluar (f(x)) y (a(x)) en una malla.                          |

# P(x′,t+τ ∣ x,t) es la probabilidad de transición:
# “Dado que el sistema estaba en el estado x en el tiempo t, cuál es la probabilidad de que esté en x′ tras un tiempo τ.”

# P(x′,t+τ ∣ x,t)=P(x′,t+τ,x,t)​/P(x,t)

def AFP_opt(cost, params):
    """
    Run AFP optimization to obtain optimal coefficients.
    """
    start_time = time()
    Xi0 = params["Xi0"]
    is_complex = np.iscomplex(Xi0[0])
    
    if is_complex:
        Xi0 = np.concatenate((np.real(Xi0), np.imag(Xi0)))  # Split vector for complex numbers
        opt_fun = lambda Xi: cost(Xi[:len(Xi)//2] + 1j * Xi[len(Xi)//2:], params)
    else:
        opt_fun = lambda Xi: cost(Xi, params) # opt_fun = función de coste
    
    res = minimize(opt_fun, Xi0, method='nelder-mead',
                   options={'disp': False, 'maxfev': int(1e4)})
    # Uncomment the following line if you want to print optimization info
    print(f"Optimization time: {time() - start_time} seconds, Cost: {res.fun}")
    
    if is_complex:
        return res.x[:len(res.x)//2] + 1j * res.x[len(res.x)//2:], res.fun
    else:
        return res.x, res.fun

def SSR_loop(opt_fun, params):
    f_expr, s_expr = params['f_expr'].copy(), params['s_expr'].copy()  
    lib_f, lib_s = params['lib_f'].copy(), params['lib_s'].copy()
    Xi0 = params['Xi0'].copy()
    
    m = len(f_expr) + len(s_expr)
    Xi = np.zeros((m, m-1), dtype=Xi0.dtype)  # Output results
    V = np.zeros((m-1))  # Cost at each step
    
    Xi[:, 0], V[0] = opt_fun(params)
    active = np.array([i for i in range(m)])
    
    for k in range(1, m-1):
        min_idx = -1
        V[k] = 1e8
        for j in range(len(active)):
            tmp_active = active.copy()
            tmp_active = np.delete(tmp_active, j)
            f_active = tmp_active[tmp_active < len(f_expr)]
            s_active = tmp_active[tmp_active >= len(f_expr)] - len(f_expr)
            
            params['f_expr'] = f_expr[f_active]
            params['s_expr'] = s_expr[s_active]
            params['lib_f'] = lib_f[:, f_active]
            params['lib_s'] = lib_s[:, s_active]
            params['Xi0'] = Xi0[tmp_active]
            
            if len(s_active) > 0 and len(f_active) > 0:
                tmp_Xi, tmp_V = opt_fun(params)
                if tmp_V < V[k]:
                    min_idx = j
                    V[k] = tmp_V
                    min_Xi = tmp_Xi
        print("Cost: {0}".format(V[k]))
        active = np.delete(active, min_idx)
        Xi0[active] = min_Xi
        Xi[active, k] = min_Xi
        print(Xi[:, k])
    return Xi, V

########################################
# Modified cost function using Numba
########################################
# Calcular una función de coste Jtotal que penaliza tanto
# Jm​=i∑​W0​(i)(fτ​(i)−fKM​(i))2+W1​(i)(aτ​(i)−aKM​(i))2
# como la diferencia entre densidades (divergencia KL)
# JKL​=DK​(pdata​∥pmodel​)
# De forma que:
# Jtotal​=Jm​+λKL​JKL

# Xi: Vector de coeficientes del modelo. Contiene los pesos que multiplican las bases de drift y difusión
# Por ejemplo, si tienes una librería de términos polinomiales [x, x^2, x^3,...]
# entonces el drif modelado es: f(x)=∑_i Ξ_i * ϕ_i(x).
# Xi[:lib_f.shape[1]] → coeficientes para el drift
# Xi[lib_f.shape[1]:] → coeficientes para la difusión

# params:
# params['W']: Matriz de pesos (2 x n). W[0, :] -> Pesos error de drift, W[1, :] -> pesos error de difusión
# params['f_KM'], params['a_KM']: Estimaciones empíricas de los momentos de Kramers–Moyal (1) y (2)
# params['fp']: Objeto que resuelve la ecuación de Fokker–Planck directa o estacionaria.
#   Usado para obtener la densidad de probabilidad estimada p_model(x) mediante p_est = fp.solve(f_vals, a_vals)
# params['afp']: Objeto que implementa el operador AFP (Analytical Finite-time Propagator).
#   Permite corregir los coeficientes de drift/difusión por efectos de tiempo finito y resolver:
#   fτ​,aτ​=AFP.solve(τ). 
#   Es decir, obtiene los coeficientes corregidos por paso de tiempo finito, que se comparan con los empíricos.
# params['lib_f'], params['lib_s']: Las librerías de funciones base (features) para drift y difusión
#   por ejemplo podría ser: libf​=[x,x2,sin(x)],libs​=[1,x]
#   De modo que:
#    f_vals = lib_f @ Xi_f
#    a_vals = 0.5 * (lib_s @ Xi_a)**2
# params['N'] -> nº puntos x_i | params['tau'] -> paso de tiempo usado para calcular el AFP
# params['kl_reg'] -> Coeficiente de regularización λKL.
#   Si es mayor que cero, activa el cálculo del término de divergencia KL (distancia entre distribuciones empírica y modelada).
# params['p_hist']: Histograma de probabilidad empírica p_data(x) (obtenida de datos experimentales)
#   Se compara con la densidad estimada p_est para calcular DK
# fp.dx: Espaciado entre puntos en la malla de fp. Usado para integrar la divergencia KL numéricamente (multiplicando por dx)
def cost(Xi, params):
    """
    AFP cost function.
    Computes the weighted error between the finite-time corrected drift/diffusion
    and the Kramers-Moyal estimates, plus a KL divergence regularization term.
    """
    # Unpack parameters
    W = params['W']  # shape (2, n)
    f_KM, a_KM = params['f_KM'].flatten(), params['a_KM'].flatten()
    fp, afp = params['fp'], params['afp'] # Steady-State y AFP solve
    lib_f, lib_s = params['lib_f'], params['lib_s']
    N = params['N']
    
    # Construct parameterized drift and diffusion from libraries and coefficients Xi
    #shape[1] = nº columnas de 
    f_vals = lib_f @ Xi[:lib_f.shape[1]]
    a_vals = 0.5 * (lib_s @ Xi[lib_f.shape[1]:])**2
    
    afp.precompute_operator(np.reshape(f_vals, N), np.reshape(a_vals, N))
    f_tau, a_tau = afp.solve(params['tau'])
    
    mask = np.nonzero(np.isfinite(f_KM))[0]
    # calcula el error ponderado entre modelo y datos
    V_val = fast_weighted_error(f_tau[mask], a_tau[mask],
                                f_KM[mask], a_KM[mask],
                                W[0, mask], W[1, mask])
    # (Opcional) Regularización por divergencia KL
    if params['kl_reg'] > 0:
        p_hist = params['p_hist']
        p_est = fp.solve(f_vals, a_vals)
        kl = kl_divergence(p_hist, p_est, dx=fp.dx, tol=1e-6)
        kl = max(0, kl)
        V_val += params['kl_reg'] * kl
    # añade un término de penalización que mide cuán distintas son las distribuciones
    
    return V_val
#Resultado final J(Ξ)=∑i[W0(i)(fτ(i)−fKM(i))2+W1(i)(aτ(i)−aKM(i))2]+λ_KL*DK(pdata∥pmodel)

# 1D Markov test
def markov_test(X, lag, N=32, L=2):
    # Lagged time series
    X1 = X[:-2*lag:lag]
    X2 = X[lag:-lag:lag]
    X3 = X[2*lag::lag]
    
    # Two-time joint pdfs
    bins = np.linspace(-L, L, N+1)
    dx = bins[1]-bins[0]
    p12, _, _ = np.histogram2d(X1, X2, bins=[bins, bins], density=True)
    p23, _, _ = np.histogram2d(X2, X3, bins=[bins, bins], density=True)
    p2, _ = np.histogram(X2, bins=bins, density=True)
    p2[p2<1e-4] = 1e-4
    
    # Conditional PDF (Markov assumption)
    pcond_23 = p23.copy()
    for j in range(pcond_23.shape[1]):
        pcond_23[:, j] = pcond_23[:, j]/p2
        
    # Three-time PDFs
    p123, _ = np.histogramdd(np.array([X1, X2, X3]).T, bins=np.array([bins, bins, bins]), density=True)
    p123_markov = np.einsum('ij,jk->ijk',p12, pcond_23)
    
    # Chi^2 value
    #return utils.ntrapz( (p123 - p123_markov)**2, [dx, dx, dx] )/(np.var(p123.flatten()) + np.var(p123_markov.flatten()))
    return kl_divergence(p123, p123_markov, dx=[dx, dx, dx], tol=1e-6)


# La función verifica cuánto se cumple esta propiedad de Markov en una señal discreta  X(t)
def markov_test_b(X, lag, tol=1e-6):
    """
    Perform a 1D Markov test using the KL divergence, dynamically determining
    the number of bins using the sqrt(N) rule.

    Parameters
    ----------
    X : 1D array-like
        The full time series.
    lag : int
        The lag (in number of steps) to be used for sub-sampling.
    tol : float, optional
        Tolerance for zero probabilities in KL divergence.

    Returns
    -------
    dkl : float
        The KL divergence between the true 3-time PDF and the Markov-approximated PDF.
    """

    # Create lagged time series
    X1 = X[:-2*lag:lag]
    X2 = X[lag:-lag:lag]
    X3 = X[2*lag::lag]
    # X1=X(t)
    # X2=X(t+τ)
    # X3=X(t+2τ)
    # Así podemos estimar las distribuciones conjuntas entre ellas.

    # Determine number of bins using sqrt(N) rule (for the sub-sampled data size)
    nb = int(np.sqrt(len(X1)))
    if nb < 2:
        # If nb < 2, we can't form meaningful histograms; return NaN or 0
        return np.nan

    # Determine the ranges for each dimension from the data
    range_x1 = (X1.min(), X1.max())
    range_x2 = (X2.min(), X2.max())
    range_x3 = (X3.min(), X3.max())

    # 2D histograms: p12(x1, x2) and p23(x2, x3)
    # Con eso obtenemos aproximaciones discretas a las densidades de transición observadas en la señal
    p12, xedges12, yedges12 = np.histogram2d(
        X1, X2,
        bins=[nb, nb],
        range=[range_x1, range_x2],
        density=True
    )
    p23, xedges23, yedges23 = np.histogram2d(
        X2, X3,
        bins=[nb, nb],
        range=[range_x2, range_x3],
        density=True
    )

    # 1D histogram: p2(x2)
    p2, xedges2 = np.histogram(
        X2,
        bins=nb,
        range=range_x2,
        density=True
    )

    # Small offsets to avoid zeros
    p12 += 1e-8
    p23 += 1e-8
    p2[p2 < 1e-4] = 1e-4

    # Conditional PDF p(x3|x2) ~ p23 / p2
    # We'll do this by dividing each column j in p23 by p2[j]
    # p(x3​∣x2​)=p​(x2​,x3)/p​(x2​)
    pcond_23 = p23.copy()
    for j in range(pcond_23.shape[1]):
        pcond_23[:, j] /= p2[j]

    # 3D histogram: p123(x1, x2, x3)
    data_3d = np.column_stack([X1, X2, X3])
    #Estimar la verdadera PDF tridimensional p(x1,x2,x3)
    p123, edges123 = np.histogramdd(
        data_3d,
        bins=[nb, nb, nb],
        range=[range_x1, range_x2, range_x3],
        density=True
    )
    p123 += 1e-8

    # Markov-approximated 3D PDF: p12(x1,x2) * pcond_23(x2,x3)
    # shape: (nb, nb, nb)
    # Si el proceso fuera estrictamente Markoviano, se cumpliría: 
    # p(x1,x2,x3)=p(x1,x2) p(x3∣x2)
    p123_markov = np.einsum('ij,jk->ijk', p12, pcond_23)

    # Compute bin widths for each dimension (assuming uniform bin spacing)
    dx1 = (range_x1[1] - range_x1[0]) / nb
    dx2 = (range_x2[1] - range_x2[0]) / nb
    dx3 = (range_x3[1] - range_x3[0]) / nb

    # KL divergence
    # DKL​=∫ p123​ * log( p123/p123_Markov) dx1​dx2​dx3​
    return kl_divergence(p123, p123_markov, dx=[dx1, dx2, dx3], tol=tol)

def adjust_range(x, pad=0.1):
    """Helper function to adjust the range of data with padding."""
    x_min, x_max = np.min(x), np.max(x)
    x_range = x_max - x_min
    pad_amount = pad * x_range
    return [x_min - pad_amount, x_max + pad_amount]

def markov_test_kde_ant(X, lag, M=50, bandwidth=0.2):
    """
    Perform a 1D Markov test using FFTKDE for density estimation.
    
    Parameters
    ----------
    X : 1D array-like
        The full time series.
    lag : int
        The lag (in number of steps) to be used for sub-sampling.
    M : int, optional
        Number of grid points for density estimation. Default is 50.
    bandwidth : float, optional
        Bandwidth parameter for KDE. Default is 0.2.
        
    Returns
    -------
    float
        KL divergence between true and Markov-approximated distributions.
    """
    # Create lagged time series
    X1 = X[:-2*lag:lag]
    X2 = X[lag:-lag:lag]
    X3 = X[2*lag::lag]
    
    # Determine ranges with padding
    range1 = adjust_range(X1, pad=0.1)
    range2 = adjust_range(X2, pad=0.1)
    range3 = adjust_range(X3, pad=0.1)
    
    # Create evaluation grids
    grid1 = np.linspace(range1[0], range1[1], M)
    grid2 = np.linspace(range2[0], range2[1], M)
    grid3 = np.linspace(range3[0], range3[1], M)
    dx1, dx2, dx3 = grid1[1]-grid1[0], grid2[1]-grid2[0], grid3[1]-grid3[0]
    
    try:
        # Estimate p12
        data12 = np.column_stack([X1, X2])
        kde12 = FFTKDE(bw=bandwidth, kernel='gaussian').fit(data12)
        grid12_x, grid12_y = np.meshgrid(grid1, grid2, indexing='ij')
        p12 = kde12.evaluate(np.column_stack([grid12_x.ravel(), grid12_y.ravel()])).reshape(M, M)
        p12 = np.clip(p12, 0, None)
        p12 /= np.sum(p12) * dx1 * dx2
        
        # Estimate p23
        data23 = np.column_stack([X2, X3])
        kde23 = FFTKDE(bw=bandwidth, kernel='gaussian').fit(data23)
        grid23_x, grid23_y = np.meshgrid(grid2, grid3, indexing='ij')
        p23 = kde23.evaluate(np.column_stack([grid23_x.ravel(), grid23_y.ravel()])).reshape(M, M)
        p23 = np.clip(p23, 0, None)
        p23 /= np.sum(p23) * dx2 * dx3
        
        # Estimate p2
        kde2 = FFTKDE(bw=bandwidth, kernel='gaussian').fit(X2.reshape(-1, 1))
        p2 = kde2.evaluate(grid2.reshape(-1, 1))
        p2 = np.clip(p2, 1e-10, None)
        p2 /= np.sum(p2) * dx2
        
        # Estimate p123
        data123 = np.column_stack([X1, X2, X3])
        kde3 = FFTKDE(bw=bandwidth, kernel='gaussian').fit(data123)
        grid_mesh = np.meshgrid(grid1, grid2, grid3, indexing='ij')
        p123 = kde3.evaluate(np.column_stack([g.ravel() for g in grid_mesh])).reshape(M, M, M)
        p123 = np.clip(p123, 0, None)
        p123 /= np.sum(p123) * dx1 * dx2 * dx3
        
        # Compute Markov approximation
        pcond_23 = p23 / p2[:, np.newaxis]
        p123_markov = np.einsum('ij,jk->ijk', p12, pcond_23)
        p123_markov /= np.sum(p123_markov) * dx1 * dx2 * dx3
        
        # Compute KL divergence
        tol = 1e-10
        p123_clipped = np.clip(p123, tol, None)
        p123_markov_clipped = np.clip(p123_markov, tol, None)
        return np.sum(p123_clipped * np.log(p123_clipped / p123_markov_clipped)) * (dx1 * dx2 * dx3)
    
    except ValueError:
        print(f"KDE evaluation failed for lag {lag}")
        return np.nan

def silverman_bandwidth(data):
    """
    Compute Silverman's rule of thumb for bandwidth selection.
    
    Parameters
    ----------
    data : array-like
        Input data (can be multidimensional)
    
    Returns
    -------
    float
        Optimal bandwidth according to Silverman's rule
    """
    data = np.asarray(data)
    n = len(data)
    d = data.shape[1] if len(data.shape) > 1 else 1
    
    # Compute standard deviation for each dimension
    sigma = np.std(data, axis=0, ddof=1)
    
    # For multivariate data, use the average of standard deviations
    sigma_avg = np.mean(sigma)
    
    # Silverman's rule of thumb
    h = (4/(d+2))**(1/(d+4)) * sigma_avg * n**(-1/(d+4))
    
    return h

### SHEATHER-JONES BANDWIDTH ESTIMATION

@njit
def L(u):
    """
    Helper function for the fourth derivative estimator.
    For the Gaussian kernel:
      L(u) = (3/(8*sqrt(pi)))*(8 - 12*u^2 + u^4) * exp(-u^2/4)
    """
    return (3.0/(8.0*np.sqrt(np.pi))) * (8 - 12*u**2 + u**4) * np.exp(-u**2/4)

@njit(parallel=True)
def compute_Rf2_fast(data, h):
    """
    Optimized version of compute_Rf2 using Numba.
    """
    n = len(data)
    total = 0.0
    count = 0
    
    for i in prange(n):
        for j in range(n):
            if i != j:
                u = (data[i] - data[j]) / h
                total += L(u)
                count += 1
    
    Rf2 = total / (count * h**5)
    return max(Rf2, 1e-10)

def compute_Rf2(data, h):
    """
    Wrapper for the optimized Rf2 computation
    """
    return compute_Rf2_fast(data, h)

@njit
def compute_silverman_fallback(sigma, n):
    """
    Compute Silverman's rule of thumb (optimized)
    """
    return 1.06 * max(sigma, 1e-6) * n**(-0.2)

def sheather_jones_bandwidth(data, tol=1e-4, max_iter=100):
    """
    Compute the Sheather-Jones plug-in bandwidth for 1D data.
    Now uses optimized components.
    """
    data = np.asarray(data)
    if data.ndim != 1:
        raise ValueError("Sheather-Jones method is only implemented for 1D data")
    
    n = len(data)
    # Initial pilot bandwidth: Silverman's rule-of-thumb
    sigma = np.std(data, ddof=1)
    if sigma < 1e-10:  # If data has near-zero variance
        return 1.06 * max(sigma, 1e-6) * n**(-1/5)
    
    h = 1.06 * sigma * n**(-1/5)
    
    try:
        # Iteratively update h until convergence
        for _ in range(max_iter):
            Rf2 = compute_Rf2(data, h)
            
            # Safe computation of h_new
            denominator = 2 * np.sqrt(np.pi) * n * Rf2
            if denominator <= 0:  # Fallback to Silverman's rule if computation fails
                return 1.06 * sigma * n**(-1/5)
            
            h_new = (1 / denominator)**(1/5)
            
            # Validate h_new
            if not np.isfinite(h_new) or h_new <= 0:
                return 1.06 * sigma * n**(-1/5)
            
            if np.abs(h_new - h) < tol * h:
                h = h_new
                break
            h = h_new
        
        # Final validation
        if not np.isfinite(h) or h <= 0:
            h = 1.06 * sigma * n**(-1/5)
        
        return h
        
    except Exception as e:
        print(f"Warning: Sheather-Jones calculation failed ({str(e)}), falling back to Silverman's rule")
        return 1.06 * sigma * n**(-1/5)

# Global variable to store the last matrix computation warnings
_last_matrix_warnings = []

def get_last_matrix_warnings():
    """Get the last recorded matrix computation warnings."""
    global _last_matrix_warnings
    warnings = _last_matrix_warnings.copy()
    _last_matrix_warnings.clear()  # Clear after retrieving
    return warnings

def markov_test_kde(X, lag, M=50, bandwidth='silverman'):
    """
    Perform a 1D Markov test using FFTKDE with automatic bandwidth selection.
    Uses consistent grid spacing across all dimensions.
    Returns three versions of the KL divergence.
    """
    global _last_matrix_warnings
    _last_matrix_warnings.clear()  # Clear previous warnings
    
    import warnings
    with warnings.catch_warnings(record=True) as w:
        warnings.simplefilter("always")
        
        # Create lagged time series
        X1 = X[:-2*lag:lag] #0lag 1lag ... -3lag  -> X(t)
        X2 = X[lag:-lag:lag] # 1lag 2lag ... -2lag -> X(t+tau)
        X3 = X[2*lag::lag] #2lag 3lag ... -1lag -> X(t+2tau)
        
        # Find global min and max to ensure consistent grid spacing
        global_min = min(X1.min(), X2.min(), X3.min())
        global_max = max(X1.max(), X2.max(), X3.max())
        total_range = global_max - global_min
        
        # Add padding using the configured percentage
        padding = (KDE_PADDING_PERCENTAGE / 100) * total_range
        global_min -= padding
        global_max += padding #20% Extra length
        # Esto es importante porque el KDE tiende a desaparecer en los bordes si no le das espacio,
        # igual que en DSP cuando aplicas ventanas demasiado cortas.
        
        # Use consistent grid spacing for all dimensions
        grid_spacing = (global_max - global_min) / (M - 1) #49 slices
        
        # Create grids with consistent spacing
        grid1 = np.arange(global_min, global_max + grid_spacing/2, grid_spacing) #50 posiciones
        grid2 = np.arange(global_min, global_max + grid_spacing/2, grid_spacing)
        grid3 = np.arange(global_min, global_max + grid_spacing/2, grid_spacing)
        
        try:
            # Compute bandwidths if automatic selection is requested
            # Es usar un filtro, un bajo bandwith no suaviza, uno muy grande suaviza mucho
            if bandwidth == 'silverman':
                
                # Es una regla “genérica” que funciona siempre y cuando:
                ## La distribución es más o menos gaussiana y unimodal.
                ## No hay colas raras.
                ## No hay multimodalidad fuerte.
                #Es como elegir un ancho de banda fijo basado en el RMS del ruido
                
                # For 2D cases (X1,X2) and (X2,X3)
                data12 = np.column_stack([X1, X2]) # Hace un array 2D con columnas X1, X2
                data23 = np.column_stack([X2, X3]) # Hace un array 2D con columnas X2, X3
                bw12 = silverman_bandwidth(data12)
                bw23 = silverman_bandwidth(data23)
                
                # For 1D case (X2)
                bw2 = silverman_bandwidth(X2.reshape(-1, 1))
                
                # For 3D case (X1,X2,X3)
                data123 = np.column_stack([X1, X2, X3])
                bw123 = silverman_bandwidth(data123)
                
            elif bandwidth == 'sheather-jones':
                #Se adapta a colas, multimodalidad y datos no gaussianos
                # Sheather–Jones es básicamente:
                ## Crear un KDE provisional.
                ## Estimar cuánta curvatura tiene la densidad.
                ## Elegir el h que mejor equilibra suavidad vs precisión.
                
                
                # For 2D cases, use geometric mean of individual bandwidths
                bw12 = np.sqrt(sheather_jones_bandwidth(X1) * sheather_jones_bandwidth(X2))
                bw23 = np.sqrt(sheather_jones_bandwidth(X2) * sheather_jones_bandwidth(X3))
                
                # For 1D case
                bw2 = sheather_jones_bandwidth(X2)
                
                # For 3D case, use geometric mean of individual bandwidths
                bw123 = np.power(sheather_jones_bandwidth(X1) * 
                               sheather_jones_bandwidth(X2) * 
                               sheather_jones_bandwidth(X3), 1/3)
            else:
                # Use constant bandwidth for all cases
                bw12 = bw23 = bw2 = bw123 = bandwidth
                
            # Grid spacing for integration
            dx = grid_spacing
            
            # f(x1​,x2​,x3​)≈f(x1​,x2​)f(x2​,x3​)/f(x2​)
            # aceptable como aproximación si la correlación principal está en x₂.
            
            # --- p12: KDE for (X1, X2) ---
            data12 = np.column_stack([X1, X2])
            kde12 = FFTKDE(bw=bw12, kernel='gaussian').fit(data12) # f​(x)=​∑K((x−xi)/h​​)/(nh1) (Sumar pequeños kernels)
            grid12_x, grid12_y = np.meshgrid(grid1, grid2, indexing='ij')
            points12 = np.column_stack([grid12_x.ravel(), grid12_y.ravel()]) #ravel=flatten()
            p12 = kde12.evaluate(points12).reshape(len(grid1), len(grid2))
            p12 = np.clip(p12, 1e-10, None)  # Ensure non-negative with small floor
            p12 /= np.sum(p12) * dx * dx #Normaliza
            
            # --- p23: KDE for (X2, X3) ---
            data23 = np.column_stack([X2, X3])
            kde23 = FFTKDE(bw=bw23, kernel='gaussian').fit(data23)
            grid23_x, grid23_y = np.meshgrid(grid2, grid3, indexing='ij')
            points23 = np.column_stack([grid23_x.ravel(), grid23_y.ravel()])
            p23 = kde23.evaluate(points23).reshape(len(grid2), len(grid3))
            p23 = np.clip(p23, 1e-10, None)
            p23 /= np.sum(p23) * dx * dx #Normaliza
            
            # --- p2: KDE for X2 (marginal) ---
            data2 = X2.reshape(-1, 1)
            kde2 = FFTKDE(bw=bw2, kernel='gaussian').fit(data2)
            points2 = grid2.reshape(-1, 1)
            p2 = kde2.evaluate(points2)
            p2 = np.clip(p2, 1e-10, None)
            p2 /= np.sum(p2) * dx #Normaliza
            
            # --- p123: KDE for (X1, X2, X3) ---
            data123 = np.column_stack([X1, X2, X3])
            kde3 = FFTKDE(bw=bw123, kernel='gaussian').fit(data123)
            grid_mesh = np.meshgrid(grid1, grid2, grid3, indexing='ij')
            points123 = np.column_stack([g.ravel() for g in grid_mesh])
            p123 = kde3.evaluate(points123).reshape(len(grid1), len(grid2), len(grid3))
            p123 = np.clip(p123, 1e-10, None)
            p123 /= np.sum(p123) * dx * dx * dx #Normaliza
            
            # Compute Markov approximation and KL divergence
            pcond_23 = p23 / p2[:, np.newaxis] # p(x2,x3)/p(x2)=p(x2/x3)
            #p123_markov[i,j,k]=p12[i,j]*p_cond23[j,k]
            p123_markov = np.einsum('ij,jk->ijk', p12, pcond_23) 
            p123_markov /= np.sum(p123_markov) * dx * dx * dx #Normaliza
            
            # Use same tolerance for all density clipping
            p123_clipped = np.clip(p123, 1e-10, None)
            p123_markov_clipped = np.clip(p123_markov, 1e-10, None)
            
            # Calculate all three KL divergences
            # KL_val mide cuánto pierde el modelo Markov respecto al estimado. p123*log(p123/p123_markov)
            kl_val = np.sum(p123_clipped * np.log(p123_clipped / p123_markov_clipped)) * (dx * dx * dx)
            #KL_val_conj mide cuánto se “desvia” la aproximación. p123_markov*log(p123_markov/p123)
            kl_val_conj = np.sum(p123_markov_clipped * np.log(p123_markov_clipped / p123_clipped)) * (dx * dx * dx)
            #Media de los dos anteriores
            kl_val_sym = 0.5 * (kl_val + kl_val_conj)
            
            if len(w) > 0:
                # Store any warnings that occurred
                _last_matrix_warnings.extend(str(warning.message) for warning in w)
            
            return kl_val, kl_val_conj, kl_val_sym
        
        except Exception as e:
            print(f"KDE evaluation failed for lag {lag}: {str(e)}")
            return np.nan, np.nan, np.nan

def autocorr_func_1d(x):
    """
    Compute the autocorrelation function for a 1D time series.
    Uses FFT for efficient computation.
    
    Parameters
    ----------
    x : array_like
        1D input array
        
    Returns
    -------
    array_like
        Autocorrelation function
    """
    n = len(x)
    # Remove mean from signal
    x = x - np.mean(x)
    # Normalize by variance
    x = x / np.std(x)
    
    # Compute FFT
    f = np.fft.fft(x, n=2*n)
    # Power spectral density
    psd = f * f.conjugate()
    # Inverse FFT to get autocorrelation
    acf = np.fft.ifft(psd)
    # Take real part and normalize
    acf = acf[:n].real
    acf = acf / acf[0]
    
    return acf

def select_best_models(optimization_costs, display_percentage, fp_obj=None, f_vals_list=None, a_vals_list=None):
    """
    Select best models based on AFP optimization costs.
    Filters out models that produce negative PDFs.
    
    Parameters:
    -----------
    optimization_costs : array-like
        List of optimization costs for all models
    display_percentage : float
        Percentage of top models to consider for mean calculation
    fp_obj : SteadyFP object, optional
        Fokker-Planck solver object for PDF calculation
    f_vals_list : list of array-like, optional
        List of drift coefficients for each model
    a_vals_list : list of array-like, optional
        List of diffusion coefficients for each model
        
    Returns:
    --------
    best_indices : array-like
        Indices of selected best models (excluding those with negative PDFs)
    """
    num_models = len(optimization_costs)
    num_top = max(1, int(np.ceil(num_models * display_percentage / 100)))
    
    # Get indices sorted by cost (ascending)
    sorted_indices = np.argsort(optimization_costs)
    
    # If we don't have the PDF calculation components, use original method
    if fp_obj is None or f_vals_list is None or a_vals_list is None:
        # Calculate mean of top performing models
        top_indices = sorted_indices[:num_top]
        top_costs_mean = np.mean([optimization_costs[i] for i in top_indices])
        
        # Select models with cost lower than the mean of top models
        best_indices = [idx for idx in range(num_models) 
                       if optimization_costs[idx] < top_costs_mean]
        
        # Sort the best indices by their costs
        best_indices.sort(key=lambda x: optimization_costs[x])
        
        return np.array(best_indices)
    
    # With PDF calculation components, filter out models with negative PDFs
    valid_indices = []
    top_valid_costs = []
    
    # First pass: find valid models among top candidates
    for idx in sorted_indices:
        if len(valid_indices) >= num_top:
            break
            
        # Calculate PDF for this model
        f_vals = f_vals_list[idx]
        a_vals = a_vals_list[idx]
        p_est = fp_obj.solve(f_vals, a_vals)
        
        # Check if PDF is non-negative everywhere (within numerical precision)
        if np.all(p_est > -1e-10):  # Allow for small numerical errors
            valid_indices.append(idx)
            top_valid_costs.append(optimization_costs[idx])
    
    if not valid_indices:
        print("Warning: No valid models found (all produce negative PDFs)")
        return np.array([])
    
    # Calculate mean of top valid models
    top_costs_mean = np.mean(top_valid_costs)
    
    # Second pass: include all valid models below mean cost
    best_indices = []
    for idx in range(num_models):
        if optimization_costs[idx] < top_costs_mean:
            # Calculate PDF for this model
            f_vals = f_vals_list[idx]
            a_vals = a_vals_list[idx]
            p_est = fp_obj.solve(f_vals, a_vals)
            
            # Include only if PDF is non-negative
            if np.all(p_est > -1e-10):
                best_indices.append(idx)
    
    # Sort the best indices by their costs
    best_indices.sort(key=lambda x: optimization_costs[x])
    
    if not best_indices:
        print("Warning: No models found below cost threshold with non-negative PDFs")
        # Return at least the best valid model found
        return np.array([valid_indices[0]]) if valid_indices else np.array([])
    
    return np.array(best_indices)

def smooth_dkl(x, sigma=5):
    """
    Smooth the KL divergence values using a Gaussian filter.
    
    Parameters:
    -----------
    x : array-like
        The KL divergence values to smooth
    sigma : float, optional
        Standard deviation for Gaussian filter, controls smoothing amount
        
    Returns:
    --------
    array-like
        Smoothed KL divergence values
    """
    return gaussian_filter1d(x, sigma)