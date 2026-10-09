"""
Core trajectory analysis functions for chromatin dynamics.
"""

import os
import numpy as np
import matplotlib.pyplot as plt
import sympy
from numpy.linalg import lstsq
from scipy.optimize import minimize
from scipy.signal import argrelextrema
import utils
import fpsolve
from config import DISPLAY_PERCENTAGE, WINDOW_SIZE, STRIDE_SELECTION, StrideSelectionStrategy
from plotting import (plot_analysis_results, plot_cross_correlation, 
                     plot_markov_test, plot_pdf_fits)



def analyze_trajectory(X, dt, t_max, coord_lab, crom, real_pca_label, output_dir, length_scale, plot_options=None):
    """    
    Analyze a single trajectory for drift and diffusion estimation.
    
    Parameters:
    -----------
    X : array-like
        The trajectory data
    dt : float
        Time step
    t_max : float
        Maximum time value
    coord_lab : str
        Coordinate label (X or Y)
    crom : int
        Chromatin index
    real_pca_label : str
        Label indicating if trajectory is real or PCA
    output_dir : str
        Directory to save output files
    length_scale : float
        Scale factor for lengths
    plot_options : dict, optional
        Dictionary controlling which plots to generate
    """

    if plot_options is None:
        plot_options = {'pdf': True, 'acf': True, 'log_acf': True, 
                       'markov': True, 'drift_diff': True, 'kde': True}

    matrix_warnings = []  # Track matrix computation warnings

    # PDF of states (Data)
    x_min, x_max = X.min(), X.max()
    N = 64
    max_span = max(abs(x_min), abs(x_max))
    edges = np.linspace(-max_span, max_span, N+1)
    centers = 0.5 * (edges[:-1] + edges[1:])
    p_hist = np.histogram(X, edges, density=True)[0]

    if plot_options['pdf']:
        plt.figure(figsize=(6, 4))
        plt.suptitle(f"Cromatin {crom}, {real_pca_label} trajectory: {coord_lab}", fontsize=12)
        plt.plot(centers, p_hist, 'k', lw=2)
        plt.title('PDF of states')
        plt.xlabel("$x$")
        plt.ylabel("Estimated pdf")
        plt.grid()
        pdf_fig_path = os.path.join(output_dir, f"orig_pdf_bundle_{crom}_coord_{coord_lab}_{real_pca_label}.svg")
        plt.savefig(pdf_fig_path, format="svg")
        plt.close()

    # Drift and Diffusion Estimation
    dX = np.diff(X) / dt
    dX2 = np.diff(X)**2 / dt # Aquí calcula la diferencia de las muestras (no sé por qué divide entr dt en vez de multiplicar)
    f_fine = np.zeros_like(centers)
    a_fine = np.zeros_like(centers)
    f_fine_err = np.zeros_like(centers)
    a_fine_err = np.zeros_like(centers)
    
    for i in range(len(edges) - 1):
        mask_fine = np.where((X[:-1] > edges[i]) & (X[:-1] < edges[i+1]))[0]
        if mask_fine.size > 0:
            f_fine[i] = np.mean(dX[mask_fine])
            a_fine[i] = 0.5 * np.mean(dX2[mask_fine])
            f_fine_err[i] = np.std(dX[mask_fine]) / np.sqrt(mask_fine.size)
            a_fine_err[i] = np.std(dX2[mask_fine]) / np.sqrt(mask_fine.size)
        else:
            f_fine[i] = np.nan
            a_fine[i] = np.nan
            f_fine_err[i] = np.nan
            a_fine_err[i] = np.nan

    # --------------------------------------------------------------------
    # Drift & Diffusion estimation
    # --------------------------------------------------------------------

    # Aquí calcula la diferencia de las muestras (no sé por qué divide entr dt en vez de multiplicar)
    # const dX = Num.div(Num.diff(X), dt);
    # const dX2 = Num.div(Num.square(Num.diff(X)), dt); 

    # const f_fine = Num.zeros(centers.length);
    # const a_fine = Num.zeros(centers.length);
    # const f_fine_err = Num.zeros(centers.length);
    # const a_fine_err = Num.zeros(centers.length);

    # (( Edge era :
    # N = 64
    # max_span = max(abs(x_min), abs(x_max))
    # edges = np.linspace(-max_span, max_span, N+1) //divide la pdf en 65 valores (es 64 a excepción del final)
    # /Edge ))
    # for (let i = 0; i < edges.length - 1; i++) { //por cada edge
    #     const mask = [];
    #     for (let k = 0; k < X.length - 1; k++) { //cogemos todos los puntos que estén en ese intervalo (1/64 de los posibles valores)
    #         if (X[k] > edges[i] && X[k] < edges[i + 1]) mask.push(k);
    #     }
    #     if (mask.length > 0) {
    #         const valsDX = mask.map(idx => dX[idx]);
    #         const valsDX2 = mask.map(idx => dX2[idx]); //de estos valores sacamos sus drift y diffusions
    #         f_fine[i] = Num.mean(valsDX);  //desplazamiento medio
    #         a_fine[i] = 0.5 * Num.mean(valsDX2); //variación media/2

    #         f_fine_err[i] = Num.std(valsDX) / Math.sqrt(mask.length); //varianza desplazamiento / nº elementos
    #         a_fine_err[i] = Num.std(valsDX2) / Math.sqrt(mask.length); //varianza variación / nº elementos
    #     } else {
    #         f_fine[i] = NaN;
    #         a_fine[i] = NaN;
    #         f_fine_err[i] = NaN;
    #         a_fine_err[i] = NaN;
    #     }
    # }

    # Autocorrelation Function (ACF)
    acf = utils.autocorr_func_1d(X)
    tau = dt * np.arange(len(X)) # en matlab sería: dt * (1:len(X))
    # Find first index where ACF < 0.5 (if any)
    if np.any(acf < 0.5):
        crossing_index = np.where(acf < 0.5)[0][0]
    else:
        crossing_index = len(acf) - 1
    tau_crossing = tau[crossing_index]
    fit_mask = tau < 0.5
    if np.sum(fit_mask) > 0:
        fit = np.polyfit(tau[fit_mask], np.log(acf[fit_mask]), 1) #regresión linear de las xs, ys
        tau_est = -1 / fit[0]
        tau_fit_ast = tau_est*.693
        # Find the index in tau that is closest to tau_fit_ast
        crossing_index_ast = np.argmin(np.abs(tau - tau_fit_ast))
    else:
        tau_est = np.nan
        tau_fit_ast = np.nan
    
    if plot_options['acf']:
        plt.figure(figsize=(8, 3))
        plt.suptitle(f"Cromatin {crom}, {real_pca_label} trajectory: {coord_lab}", fontsize=12)
        plt.plot(tau, acf, 'k')
        plt.plot(tau_crossing, acf[crossing_index], 'ro')
        plt.axvline(tau_crossing, color='gray', linestyle='--', linewidth=1)
        plt.text(tau_crossing, acf[crossing_index], f'{tau_crossing:.2f}', ha='center', va='bottom', fontsize=12)
        plt.ylabel(r"Autocorrelation $C(\tau)$")
        plt.xlabel(r"Time lag $\tau$")
        plt.xscale('log')
        plt.xlim([1e-2, 1e1])
        plt.grid()
        acf_fig_path = os.path.join(output_dir, f"acf_bundle_{crom}_coord_{coord_lab}_{real_pca_label}.svg")
        plt.savefig(acf_fig_path, format="svg")
        plt.close()
    
    
    # --------------------------------------------------------------------
    # Autocorrelation
    # --------------------------------------------------------------------

    # const acf = utils.autocorr_func_1d(X); //calcula la autocorrelación de toda la señal
    # const tau = Num.mul(Num.arange(X.length), dt); // dt * (1:len(X)) = [dt,2dt,3dt,etc]

    # .//Definimos un crossing_index que es el primer índice con baja autocorrelación (<0.5), o si no el último elemento (acota)
    # let crossing_index = Num.findFirstIndex(acf, v => v < 0.5);
    # if (crossing_index < 0) crossing_index = acf.length - 1;
    # const tau_crossing = tau[crossing_index]; //valor en el límite

    # const fit_mask: boolean[] = tau.map(t => t < 0.5); //Lags tienen que ser mayores 0.5s
    # let tau_est = NaN, tau_fit_ast = NaN, crossing_index_ast = 0;

    # if (Num.sum(fit_mask.map(v => v ? 1 : 0)) > 0) { //Si el array no está vacío (de los elementos con autocorr>0.5)
    #     const xs = tau.filter((t, i) => fit_mask[i]); //cogemos los valores que sí que están acotados (tvd)
    #     const ys = acf.filter((t, i) => fit_mask[i]).map(val => Math.log(val));
    #     const fit = Num.polyfit(xs, ys, 1); //Regresión linear (porque 1 es regresión linear, 2 es una función cuadrática)

    #     tau_est = -1 / fit[0];
    #     tau_fit_ast = tau_est * 0.693;

    #     .//Find the index in tau that is closest to tau_fit_ast
    #     crossing_index_ast = Num.argmin(tau.map(t => Math.abs(t - tau_fit_ast))); 
    # }

    # //ACF plot
    # if (plot_options.acf) {
    #     Plot.figure({ width: 800, height: 300 });
    #     Plot.title(`Cromatin ${crom}, ${real_pca_label} trajectory: ${coord_lab}`);
    #     Plot.plot(tau, acf, { color: "black" });
    #     Plot.plotPoint(tau_crossing, acf[crossing_index], { color: "red" });

    #     Plot.save(`${output_dir}/acf_bundle_${crom}_coord_${coord_lab}_${real_pca_label}.svg`);
    #     Plot.close();
    # }

    
    # Logarithm of ACF
    if plot_options['log_acf']:
        plt.figure(figsize=(8, 4))
        plt.suptitle(f"Cromatin {crom}, {real_pca_label} trajectory:{coord_lab}", fontsize=12)

        # Use np.clip to avoid taking the logarithm of non-positive values.
        plt.plot(tau[fit_mask], np.polyval(fit, tau[fit_mask]), 'g-o', label=f'Linear fit ($\\tau_{{fit}}^*$ = {tau_est:.2f} s)')
        plt.plot(tau, np.log(np.clip(acf, 1e-1, None)), 'k', label=r'Experimental log($C(\tau)$)')

        # Highlight the point where acf crosses 0.5
        plt.plot(tau_crossing, np.log(np.clip(acf[crossing_index], 1e-1, None)), 'ro')
        plt.text(tau_crossing, np.log(np.clip(acf[crossing_index], 1e-1, None)), f'{tau_crossing:.2f}', 
                ha='center', va='bottom', fontsize=12, color='black')
        plt.axvline(tau_crossing, color='gray', linestyle='--', linewidth=1, label=f' $t_{{1/2}}$ = {tau_crossing:.2f} s ')

        # Highlight the point where tau one half is estimated to cross acf 0.5 from the fit
        plt.plot(tau_fit_ast, np.log(np.clip(acf[crossing_index_ast], 1e-1, None)), 'go')
        plt.text(tau_fit_ast, np.log(np.clip(acf[crossing_index_ast], 1e-1, None)), f'{tau_fit_ast:.2f}', 
                ha='center', va='bottom', fontsize=12, color='black')
        plt.axvline(tau_fit_ast, color='green', linestyle='--', linewidth=1, 
                    label=f'$t_{{1/2}}^* = \\log(2)\\cdot \\tau_{{fit}}^*$= {tau_fit_ast:.2f} s')
        plt.xlabel(r'Time lag $\tau$')
        plt.ylabel(r'log($C(\tau)$)')
        plt.gca().set_xscale('log')
        plt.grid()
        plt.legend()
        plt.tight_layout()
        log_acf_fig_path = os.path.join(output_dir, f"log_acf_bundle_{crom}_coord_{coord_lab}_{real_pca_label}.svg")
        plt.savefig(log_acf_fig_path, format="svg")
        plt.close()


    # --------------------------------------------------------------------
    # Log ACF plot
    # --------------------------------------------------------------------

    # if (plot_options.log_acf) {
    #     Plot.figure({ width: 800, height: 400 });

    #     const xs = tau.filter((_, i) => fit_mask[i]);
    #     const ysFit = Num.polyval([Math.log(acf[fit_mask.indexOf(true)])], xs); // fictitious

    #     Plot.plot(xs, ysFit, { color: "green", marker: "o" });

    #     const log_acf = acf.map(v => Math.log(Math.max(v, 1e-1)));
    #     Plot.plot(tau, log_acf, { color: "black" });

    #     Plot.save(`${output_dir}/log_acf_bundle_${crom}_coord_${coord_lab}_${real_pca_label}.svg`);
    #     Plot.close();
    # }


    # Compute Markov test and get optimal stride
    lag = np.round(np.logspace(0, 2.5, 300)).astype(int) # 300 puntos entre 0 y 25 dBs
    lag = np.unique(lag) # que no se repitan por si 300 es muy pequeño
    kl_results = []
    
    for delta in lag:
        # devuelve kl_val, kl_val_conj, kl_val_sym
        result = utils.markov_test_kde(X, delta, M=50, bandwidth='silverman') 
        kl_results.append(result)
        
        # Check for any warnings from the matrix exponential computation
        warnings_info = utils.get_last_matrix_warnings()
        if warnings_info:
            matrix_warnings.append({
                'lag': delta,
                'warnings': warnings_info
            })
    
    # If any warnings were logged, print a summary at the end
    if matrix_warnings:
        print("\nMatrix computation warnings summary:")
        print(f"Chromatin {crom}, Component {coord_lab}:")
        for w in matrix_warnings:
            print(f"  Lag {w['lag']}: {', '.join(str(str(warning)) for warning in w['warnings'])}")
        print()  

    kl_results = np.array(kl_results)
    kl_div = kl_results[:, 0]
    kl_div_conj = kl_results[:, 1]  # Conjugate KL divergence
    kl_div_sym = kl_results[:, 2]  # Symmetrized KL divergence

    valid_mask = ~np.isnan(kl_div)
    valid_mask_conj = ~np.isnan(kl_div_conj)
    valid_mask_sym = ~np.isnan(kl_div_sym)
    
    # Check if we have enough valid data points
    if np.sum(valid_mask) < WINDOW_SIZE + 1:
        print(f"Warning: Not enough valid data points for {coord_lab} component of chromatin {crom}")
        stride = 1  # Default to stride of 1 if not enough valid points
        tau_coarse = stride * dt
        return
        
    kl_div_valid = kl_div[valid_mask]
    kl_div_conj_valid = kl_div_conj[valid_mask_conj]
    kl_div_sym_valid = kl_div_sym[valid_mask_sym]
    lag_filtered = lag[valid_mask]
    lag_filtered_conj = lag[valid_mask_conj]
    lag_filtered_sym = lag[valid_mask_sym]
    
    # Find local minima only if we have enough valid points
    local_minima_indices = argrelextrema(kl_div_valid, np.less, order=WINDOW_SIZE)[0]
    local_minima_indices_conj = argrelextrema(kl_div_conj_valid, np.less, order=WINDOW_SIZE)[0]
    local_minima_indices_sym = argrelextrema(kl_div_sym_valid, np.less, order=WINDOW_SIZE)[0]

    minima_lag = lag_filtered[local_minima_indices]
    minima_lag_conj = lag_filtered_conj[local_minima_indices_conj]
    minima_lag_sym = lag_filtered_sym[local_minima_indices_sym]
    
    minima_kl_div = kl_div_valid[local_minima_indices]
    minima_kl_div_conj = kl_div_conj_valid[local_minima_indices_conj]
    minima_kl_div_sym = kl_div_sym_valid[local_minima_indices_sym]
    
    # Calculate smoothed versions of the KL divergences
    smooth_kl_sym = utils.smooth_dkl(kl_div_sym_valid)

    # Find all minima of smoothed symmetric DKL
    minima_indices = argrelextrema(smooth_kl_sym, np.less, order=WINDOW_SIZE)[0]
    
    
    if len(minima_indices) == 0:
        # If no local minima found, use global minimum
        min_smooth_idx = np.argmin(smooth_kl_sym)
        stride_values = [int(np.round(lag_filtered_sym[min_smooth_idx]))]
    else:
        if STRIDE_SELECTION == StrideSelectionStrategy.FIRST_MINIMUM:
            stride_values = [int(np.round(lag_filtered_sym[minima_indices[0]]))]
        elif STRIDE_SELECTION == StrideSelectionStrategy.GLOBAL_MINIMUM:
            global_min_idx = minima_indices[np.argmin(smooth_kl_sym[minima_indices])]
            stride_values = [int(np.round(lag_filtered_sym[global_min_idx]))]
        else:  # ALL_MINIMA
            stride_values = [int(np.round(lag_filtered_sym[idx])) for idx in minima_indices]
            # Sort by DKL value to analyze from best to worst
            stride_values = sorted(stride_values, key=lambda s: smooth_kl_sym[np.where(lag_filtered_sym == s)[0][0]])



    # --------------------------------------------------------------------
    # Markov test & stride selection
    # --------------------------------------------------------------------

    # const lag = Num.unique(Num.round(Num.logspace(0, 2.5, 300)).map(v => Math.floor(v))); #300 valores entre 0 y 25dBs

    # const kl_results: number[][] = [];
    # for (const delta of lag) {
    #     .//result es [kl_val, kl_val_conj, kl_val_sym] (se llaman divergencias kl)
    #     const result = utils.markov_test_kde(X, delta, 50, "silverman"); //hacer markov test con este tau
    #     kl_results.push(result); //y añadirlo

    #     const warnings = utils.get_last_matrix_warnings();
    #     if (warnings.length > 0) {
    #         matrix_warnings.push({ lag: delta, warnings });
    #     }
    # }

    # const kl_arr = Num.array(kl_results);
    # const kl_div = kl_arr.col(0);
    # const kl_div_conj = kl_arr.col(1);
    # const kl_div_sym = kl_arr.col(2); //Coge cada array de resultados devuelto de markvo_test_kde

    # const valid_mask = kl_div.map(v => !isNaN(v));
    # const lag_filtered = lag.filter((_, i) => valid_mask[i]);
    # const kl_div_valid = kl_div.filter((v, i) => valid_mask[i]); //Se asegura de que no sean null

    # if (lag_filtered.length < WINDOW_SIZE + 1) { //WINDOW_SIZE=50 para que sean válidos
    #     console.log(`Warning: Not enough valid data points for ${coord_lab}`);
    #     return;
    # }

    # .//devuelve los indices de los puntos que son menores que sus vecinos
    # const minima_indices = argrelextrema(kl_div_valid, "less", WINDOW_SIZE); 
    # const minima_lag = minima_indices.map(i => lag_filtered[i]); //consige los lags de esos puntos
    # const minima_kl = minima_indices.map(i => kl_div_valid[i]); //consige los valores kl de esos puntos

    # .//Hace gaussian_filter1d con sigma=5 de los resultados kl
    # .//Vamos una convolución con una gaussiana de sigma=5
    # const smooth_kl_sym = utils.smooth_dkl(kl_div_sym.filter((_, i) => valid_mask[i]));
    # const minima_sym = argrelextrema(smooth_kl_sym, "less", WINDOW_SIZE); //vuelve a coger los mínimos

    # let stride_values: number[] = [];
    # if (minima_sym.length === 0) { //Si no hay ningún mínimo
    #     const idx = Num.argmin(smooth_kl_sym); //Coge el mínimo valor (eso ya lo hace la función, no va a pasar)
    #     stride_values = [lag_filtered[idx]]; //recuerda que lag es el tau del Markov Test
    # } else {
    #     if (STRIDE_SELECTION === StrideSelectionStrategy.FIRST_MINIMUM) { 
    #         stride_values = [lag_filtered[minima_sym[0]]]; //Coge el primer delay mínimo
    #     } else if (STRIDE_SELECTION === StrideSelectionStrategy.GLOBAL_MINIMUM) {
    #         .//Coge el mínimo mínimo (mínimo global)
    #         const imin = Num.argmin(minima_sym.map(i => smooth_kl_sym[i]));
    #         stride_values = [lag_filtered[minima_sym[imin]]];
    #     } else {
    #         stride_values = minima_sym.map(i => lag_filtered[i]); //Coge todos los mínimos por defecto
    #     }
    # }



    results = []
    for stride in stride_values: #Stride_values son los valores óptimos del Markov Test
        tau_coarse = stride * dt
        
        if plot_options['markov']:
            # Plot original KL divergence and its minima with transparency
            # Plot conjugate KL divergence and its minima with transparency
            # Plot symmetrized KL divergence and its minima with transparency
            # Plot smoothed versions with their minima (on top, with full opacity)
            plot_markov_test(lag_filtered, kl_div_valid, minima_lag, minima_kl_div,
                        lag_filtered_conj, kl_div_conj_valid, minima_lag_conj, minima_kl_div_conj,
                        lag_filtered_sym, kl_div_sym_valid, minima_lag_sym, minima_kl_div_sym,
                        dt, crom, real_pca_label, coord_lab, output_dir)
            

        # Analyze subsampled sequences for this stride
        # por cada valor mínimo de lag, analizamos las subsecuencias posibles
        subsampled_sequences = [X[offset::stride] for offset in range(stride)]
        f_KM_list = []
        a_KM_list = []
        f_err_list = []
        a_err_list = []
        
        # Vuelve a calcular el drift y el diffusion con este lag más pequeño y los añade a los arr de arriba
        # para cada subsecuencia
        for Y in subsampled_sequences:
            dY = np.diff(Y) / tau_coarse
            dY2 = np.diff(Y)**2 / tau_coarse
            f_KM = np.zeros_like(centers)
            a_KM = np.zeros_like(centers)
            f_err = np.zeros_like(centers)
            a_err = np.zeros_like(centers)
            
            for i in range(len(edges) - 1):
                mask = np.where((Y[:-1] > edges[i]) & (Y[:-1] < edges[i+1]))[0]
                if mask.size > 0: 
                    f_KM[i] = np.mean(dY[mask])
                    a_KM[i] = 0.5 * np.mean(dY2[mask])
                    f_err[i] = np.std(dY[mask]) / np.sqrt(mask.size)
                    a_err[i] = np.std(dY2[mask]) / np.sqrt(mask.size)
                else:
                    f_KM[i] = np.nan
                    a_KM[i] = np.nan
                    f_err[i] = np.nan
                    a_err[i] = np.nan
                    
            f_KM_list.append(f_KM)
            a_KM_list.append(a_KM)
            f_err_list.append(f_err)
            a_err_list.append(a_err)

        # AFP Optimization and SINDy Modeling
        x_sym = sympy.symbols('x')
        f_expr = np.array([x_sym**i for i in [0, 1, 2, 3]]) #[1,x,x^2,x^3]
        s_expr = np.array([x_sym**i for i in [0]]) #[1]
        
        lib_f = np.zeros((len(f_expr), len(centers)))
        lib_s = np.zeros((len(s_expr), len(centers)))
        
        for k in range(len(f_expr)):
            lamb_expr = sympy.lambdify(x_sym, f_expr[k]) #(x)=>[1,x,x^2,x^3] (depende de la k en la que estemos)
            lib_f[k] = lamb_expr(centers)  #centers son los valores de enmedio del intervalo de valores de la pdf
        for k in range(len(s_expr)):
            lamb_expr = sympy.lambdify(x_sym, s_expr[k]) #(x)=>1
            lib_s[k] = lamb_expr(centers)  #centers son los valores de enmedio del intervalo de valores de la pdf
        
        # Initial optimization (aplica least squares method a los valores medios de drift y difusión)
        Xi_list = []
        for f_KM, a_KM in zip(f_KM_list, a_KM_list): # por cada sublista (con mismo submuestreo (tau))
            Xi0 = np.zeros(len(f_expr) + len(s_expr))
            mask = np.where(np.isfinite(f_KM))[0]
            if mask.size > 0:
                #Recordemos que:
                    # f_KM[i] = np.mean(dY[mask])
                    # a_KM[i] = 0.5 * np.mean(dY2[mask])
                # Coge los least squares matrix solutions de las medias de drift 
                # y lo mismo de sqrt(2* (las medias de difusión))
                Xi0[:len(f_expr)] = lstsq(lib_f[:, mask].T, f_KM[mask], rcond=None)[0]
                Xi0[len(f_expr):] = lstsq(lib_s[:, mask].T, np.sqrt(2 * a_KM[mask]), rcond=None)[0]
                
                # Posteriormente en la optimización se hace f_val=Lib_f*Xi_f, esto no quiere decir que 
                # f_vals sea lo mismo que f_KM (que es de donde viene Xi), esto es una aproximación.
                # f_vals no están organizados por segmento por lo que no son momentos (dependen del tiempo
                # y no de los valores de X (como la pdf))
                # Por eso se tienen que agrupar otra vez estos resultados (dentro de AdjFP.solve) y
                # luego calcular los momentos (ej.: usando el operador adjunto).
                # Sin embargo podríamos hacerlo si aumentamos el nº de elementos haciendo
                # inter****, es decir convolución con un filtro, para que tau sea demasiado pequeño.
                
            else:
                Xi0[:] = np.nan
            Xi_list.append(Xi0)
        
        # AFP optimization
        Xi_optimized_list = []
        optimization_costs = []
        f_vals_list = []
        a_vals_list = []
        kl_divergences_list = []
        
        for idx, (Xi0, f_KM, a_KM, f_err, a_err) in enumerate(zip(Xi_list, f_KM_list, a_KM_list, f_err_list, a_err_list)):
            W = np.array((f_err.flatten(), a_err.flatten()))
            W[np.abs(W) < 1e-12] = 1e6
            W[~np.isfinite(W)] = 1e6
            W = 1 / W
            W = W / np.nansum(W)
        
            afp = fpsolve.AdjFP(centers) #centers son los valores de enmedio del intervalo de valores de la pdf
            # Takes a 1D array x defining the spatial grid.
            # Calls AdjFP.derivs1d(x) to construct 1D numerical differentiation matrices (Dx, Dxx). 
            # These sparse matrices approximate the first and second derivatives on the grid using finite differences.

            # Operator Method: Sets the method for defining the Fokker-Planck operator to self.operator1d.

            # Moment Precomputation: Sets up arrays (self.m1, self.m2) used later to calculate the first
            # and second moments of the solution distribution. 


                #internamente afp hace: (Adjoint Fokker-Planck)
                
                # self.Dx, self.Dxx = AdjFP.derivs1d(x)
                # self.XX = np.meshgrid(*self.x, indexing='ij')
                # Donde dervis1d hace:
                    # N = len(x)
                    # dx = x[1]-x[0]
                    # one = np.ones((N))
                    
                    # # Calcula las primeras de derivadas (diferencias)
                    # Dx = sparse.diags([one, -one], [1, -1], shape=(N, N))
                    # Dx = sparse.lil_matrix(Dx)
                    # # Forward/backwards difference at boundaries
                    # Dx[0, :3] = [-3, 4, -1]
                    # Dx[-1, -3:] = [1, -4, 3]
                    # Dx = sparse.csr_matrix(Dx)/(2*dx)
                    
                    # # Second derivative
                    # Dxx = sparse.diags([one, -2*one, one], [1, 0, -1], shape=(N, N))
                    # Dxx = sparse.lil_matrix(Dxx)
                    # # Forwards/backwards differences  (second-order accurate)
                    # Dxx[-1, -4:] = [1.25, -2.75, 1.75, -.25]  
                    # Dxx[0, :4] = [-.25, 1.75, -2.75, 1.25]  
                    # Dxx = sparse.csr_matrix(Dxx)/(dx**2)
            fp_obj = fpsolve.SteadyFP(N, centers[1] - centers[0])
        
            params = {
                "W": W,
                "f_KM": f_KM,
                "a_KM": a_KM,
                "Xi0": Xi0,
                "f_expr": f_expr,
                "s_expr": s_expr,
                "lib_f": lib_f.T,
                "lib_s": lib_s.T,
                "N": N,
                "kl_reg": 10,
                "fp": fp_obj,
                "afp": afp,
                "p_hist": p_hist,
                "tau": tau_coarse,
                "radial": False
            }
        
            Xi_optimized, cost = utils.AFP_opt(utils.cost, params)
            Xi_optimized_list.append(Xi_optimized)
            optimization_costs.append(cost)
            
            Xi_f = Xi_optimized[:len(f_expr)]
            Xi_s = Xi_optimized[len(f_expr):]
            f_sindy = sympy.lambdify(x_sym, utils.sindy_model(Xi_f, f_expr))
            s_sindy = sympy.lambdify(x_sym, utils.sindy_model(Xi_s, s_expr))
            a_sindy = lambda x: 0.5 * s_sindy(x)**2
            
            f_vals = f_sindy(centers)
            a_vals = a_sindy(centers) 
            if np.isscalar(f_vals):
                f_vals = f_vals + 0 * centers
            if np.isscalar(a_vals):
                a_vals = a_vals + 0 * centers
                
            f_vals_list.append(f_vals)
            a_vals_list.append(a_vals)
            
            p_fit = fp_obj.solve(f_vals, a_vals)
            kl_div = utils.kl_divergence(p_hist, p_fit, dx=fp_obj.dx, tol=1e-6)
            kl_divergences_list.append(kl_div)

        # Best models selection
        best_indices = utils.select_best_models(
            optimization_costs, 
            DISPLAY_PERCENTAGE,
            fp_obj=fp_obj,           # Add Fokker-Planck solver
            f_vals_list=f_vals_list, # Add drift coefficients
            a_vals_list=a_vals_list  # Add diffusion coefficients
        )

        if len(best_indices) == 0:
            print(f"Warning: No valid models found for chromatin {crom}, {coord_lab}")
            continue

        # Create subfolder for this stride if using ALL_MINIMA
        if STRIDE_SELECTION == StrideSelectionStrategy.ALL_MINIMA:
            stride_dir = os.path.join(output_dir, f"stride_{stride}_{coord_lab}")
            os.makedirs(stride_dir, exist_ok=True)
        else:
            stride_dir = output_dir

        # Plot results for this stride
        plot_analysis_results(centers, p_hist, f_KM, a_KM, f_err, a_err,
                            f_vals_list, a_vals_list, optimization_costs,
                            kl_divergences_list, best_indices, tau_coarse,
                            crom, real_pca_label, coord_lab, stride_dir, stride)
        
        plot_cross_correlation(optimization_costs, kl_divergences_list,
                             crom, real_pca_label, coord_lab, tau_coarse,
                             stride_dir, stride)

        # Plot PDF fits only for selected best models
        plot_pdf_fits(centers, p_hist, fp_obj, f_vals_list, a_vals_list, best_indices,
                     crom, real_pca_label, coord_lab, stride, stride_dir)

        # Save polynomial coefficients for selected best models
        save_polynomial_coefficients(Xi_optimized_list, best_indices, f_expr, s_expr,
                                  crom, coord_lab, real_pca_label, stride, stride_dir)

        # Store results for comparison if using ALL_MINIMA
        if STRIDE_SELECTION == StrideSelectionStrategy.ALL_MINIMA:
            results.append({
                'stride': stride,
                'tau_coarse': tau_coarse,
                'dkl_value': smooth_kl_sym[np.where(lag_filtered_sym == stride)[0][0]],
                'optimization_costs': optimization_costs,
                'kl_divergences': kl_divergences_list
            })

    # If using ALL_MINIMA, save a summary of all analyses
    if STRIDE_SELECTION == StrideSelectionStrategy.ALL_MINIMA and results:
        summary_file = os.path.join(output_dir, f"stride_analysis_summary_{crom}_{coord_lab}.txt")
        with open(summary_file, 'w') as f:
            f.write(f"Summary of analyses for different stride values\n")
            f.write(f"Chromatin {crom}, {real_pca_label} trajectory: {coord_lab}\n\n")
            for result in results:
                f.write(f"Stride: {result['stride']}\n")
                f.write(f"Physical time (tau): {result['tau_coarse']:.3f}\n")
                f.write(f"Symmetric DKL value: {result['dkl_value']:.6e}\n")
                f.write(f"Mean optimization cost: {np.mean(result['optimization_costs']):.6e}\n")
                f.write(f"Mean KL divergence: {np.mean(result['kl_divergences']):.6e}\n\n")



def save_polynomial_coefficients(Xi_optimized_list, best_indices, f_expr, s_expr,
                               crom, coord_lab, real_pca_label, stride, output_dir):
    """Save the best polynomial coefficients for drift and diffusion."""
    drift_coeff_file = os.path.join(output_dir, 
                                   f"drift_poly_bundle_{crom}_coord_{coord_lab}_{real_pca_label}_{stride}_best_coeff.txt")
    diffusion_coeff_file = os.path.join(output_dir, 
                                       f"diffusion_poly_bundle_{crom}_coord_{coord_lab}_{real_pca_label}_{stride}_best_coeff.txt")
    
    with open(drift_coeff_file, 'w') as drift_file, open(diffusion_coeff_file, 'w') as diff_file:
        drift_file.write("Best Drift Polynomial Coefficients\n")
        drift_file.write("===================================\n\n")
        diff_file.write("Best Diffusion Polynomial Coefficients\n")
        diff_file.write("=========================================\n\n")
        
        for display_idx, model_idx in enumerate(best_indices):
            Xi_best = Xi_optimized_list[model_idx]
            drift_coeff = Xi_best[:len(f_expr)]
            diffusion_coeff = Xi_best[len(f_expr):]
            
            drift_file.write(f"Model {display_idx+1} (Subsample {model_idx+1}):\n")
            drift_file.write("  " + ", ".join(f"{coef:.6e}" for coef in drift_coeff) + "\n\n")
            
            diff_file.write(f"Model {display_idx+1} (Subsample {model_idx+1}):\n")
            diff_file.write("  " + ", ".join(f"{coef:.6e}" for coef in diffusion_coeff) + "\n\n")



# ============================================================================
# Helper: Save polynomial coefficients
# ============================================================================

# export function save_polynomial_coefficients(
#     Xi_optimized_list: number[][],
#     best_indices: number[],
#     f_expr: any[],
#     s_expr: any[],
#     crom: number,
#     coord_lab: string,
#     real_pca_label: string,
#     stride: number,
#     output_dir: string
# ): void {
#     .//Guarda los mejores valores de drift, diffussion en dos archivos.
#     const drift_file = utils.openTextFile(
#         `${output_dir}/drift_poly_bundle_${crom}_coord_${coord_lab}_${real_pca_label}_${stride}_best_coeff.txt`
#     );
#     const diff_file = utils.openTextFile(
#         `${output_dir}/diffusion_poly_bundle_${crom}_coord_${coord_lab}_${real_pca_label}_${stride}_best_coeff.txt`
#     );

#     drift_file.write("Best Drift Polynomial Coefficients\n");
#     drift_file.write("===================================\n\n");
#     diff_file.write("Best Diffusion Polynomial Coefficients\n");
#     diff_file.write("=========================================\n\n");

#     best_indices.forEach((model_idx, display_idx) => {
#         const Xi = Xi_optimized_list[model_idx];
#         const drift = Xi.slice(0, f_expr.length);
#         const diff = Xi.slice(f_expr.length);

#         drift_file.write(`Model ${display_idx + 1} (Subsample ${model_idx + 1}):\n`);
#         drift_file.write("  " + drift.map(c => c.toExponential(6)).join(", ") + "\n\n");

#         diff_file.write(`Model ${display_idx + 1} (Subsample ${model_idx + 1}):\n`);
#         diff_file.write("  " + diff.map(c => c.toExponential(6)).join(", ") + "\n\n");
#     });

#     drift_file.close();
#     diff_file.close();
# }