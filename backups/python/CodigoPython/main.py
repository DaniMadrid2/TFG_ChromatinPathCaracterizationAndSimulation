#!/usr/bin/env python
"""
Langevin Inference of Chromatin trajectories for Determination of Nuclear cell Dynamics (LICh-DND)
Author: Antonio Caamano (mar, 15 2025, North Bethesda, MD)
"""
import os
import sys
import argparse
import numpy as np
from scipy.io import loadmat
from tqdm import tqdm

# Add custom directory to the system path
sys.path.insert(0, "/Users/danie/OneDrive/Escritorio/Teleco/TFG/CodigoPython")

from config import (
    SAMPLING_FREQUENCY, TIME_MAX, LENGTH_SCALE, 
    ORIGINALS_PATH, DATA_FILENAME, DATA_FILEPATH, BASE_DIR,
    DISPLAY_PERCENTAGE, TRAJECTORY_TYPE,
    configure_matplotlib
)
from plotting import plot_chromatin_map
from kde_analysis import analyze_kde_validation
from trajectory_analysis import analyze_trajectory

def setup_argparse():
    """Set up command line argument parsing."""
    parser = argparse.ArgumentParser(description='Analyze chromatin bundle trajectories')
    parser.add_argument('--chromatin', type=int, help='Chromatin index to analyze')
    parser.add_argument('--component', choices=['X', 'Y'], help='Component to analyze (X or Y)')
    parser.add_argument('--trajectory-type', choices=['pca', 'real'], 
                       default=TRAJECTORY_TYPE,
                       help='Type of trajectory to analyze')
    
    # Add plot options
    plot_group = parser.add_argument_group('Plot Options')
    plot_group.add_argument('--plot-pdf', action='store_true', help='Generate PDF plots')
    plot_group.add_argument('--plot-acf', action='store_true', help='Generate ACF plots')
    plot_group.add_argument('--plot-log-acf', action='store_true', help='Generate log ACF plots')
    plot_group.add_argument('--plot-markov', action='store_true', help='Generate Markov test plots')
    plot_group.add_argument('--plot-drift-diff', action='store_true', help='Generate drift-diffusion plots')
    plot_group.add_argument('--plot-kde', action='store_true', help='Generate KDE validation plots')
    plot_group.add_argument('--plot-all', action='store_true', help='Generate all plots')
    plot_group.add_argument('--plot-map', action='store_true', help='Generate chromatin map')
    
    return parser.parse_args()


# X′: dirección principal del movimiento (máxima varianza).
# Y′: dirección ortogonal (menor varianza).
# 
# Esto es una rotación lineal ortonormal:
# [X′Y′]=VT[x−mean(x) y−mean(y)] donde V son los vectores singulares (autovectores de la covarianza).

# Interpretación física
# - En el contexto de dinámica estocástica, el movimiento de la partícula puede tener correlaciones entre 
#   x e y (por ejemplo, si hay un canal curvado o un valle energético inclinado) 
#   (ρ_xy=Cov(x,y)/(σ_x σ_y) => Centras las posiciones x,y respecto a su centro, mides sólo las diferencias 
#   (los cambios respecto a un supuesto centro) (que no tiene mucho sentido tener cuenta el centro a menos que x sea grande,
#   pero ayuda a que no dependa de la posición). Calculas la energía de esa x*y y divides entre las contribuciones de energía
#   de cada una (de x y de y (Varianzas)).
# ).
# - La PCA “rectifica” el movimiento: transforma el sistema para que los nuevos ejes X′ y Y′ 
#   representen direcciones dinámicamente independientes (al menos linealmente).
# __direcciones dinámicamente independientes__ => Ahora las nuevas X e Y son en las que hay más movimiento,
# así los potenciales que calculamos estarán en las posiciones más importantes, aunque al reconstruir en todas 
# las direcciones (en 3D) no sea exactamente igual a la real. (Va a haber que probar cuánto se relaciona 
# la MSD original de si escogemos cualquier eje de coordenadas (empezar con 8 0,45º,90,...))
# Así puedes estudiar el potencial efectivo y las coeficientes de drift y difusión por separado en cada eje

# Qué implica que se puedan separar las velocidades
# 
# Esto es una hipótesis crucial:
# Que el movimiento (y, por tanto, la dinámica de Fokker–Planck) sea separable en los dos ejes principales.
# P(x′,y′,t)=Px​(x′,t)Py​(y′,t)
# y por tanto, la ecuación de Fokker–Planck 2D se descompone en dos ecuaciones 1D independientes
#   ∂tPx​​=−∂x′​[Dx(1)​Px​]+∂x′^2​[Dx(2)​Px​]
#   ∂tPy​​=−∂y′​[Dy(1)​Py​]+∂y′^2​[Dy(2)​Py​]
#
# Esto solo es válido si las velocidades en los nuevos ejes están desacopladas, es decir, si:
# Cov(vx′,vy′)≈0
# y los términos de drift/diffusión cruzados Dxy(1,2) son despreciables.
#
# Así ahora puedes estudiar en cada eje que tendrá su propia AFP:
# ∂tX′=fx′​(X′)+sqrt(2D(X′))ξ_x′(t)
# E inferir potenciales así:
# Ux′​(X′)=−∫fx′​(X′)dX′
#
#### Situaciones típicas donde los términos cruzados NO son despreciables
### Potenciales no separables
#
# Ejemplo clásico: un valle energético inclinado o curvado.
# 
# U(x,y)=0.5*(x−αy)2+0.5*βy2
# Aquí el gradiente tiene componentes cruzadas:
# 
# fx=−∂U∂x=−(x−αy)
# fy=−∂U∂y=α(x−αy)−βy
# → los movimientos en  x y  y están acoplados linealmente.
# Es decir, cuando se incluyen términos que dependen de la diferencia del as posiciones (x-αy) 
# o de su multiplicación x*y 
# en el caso anterior tenemos una gráfica x^2 en la dirección x-αy=cte
# En estos casos podemos dividir los potenciales en distintas bases que incluyan las rectas x-αy,
# y luego reconvertir (volve a la base original) y sumarlas
# 
# Esto ocurre en paisajes “canalizados” o “inclinados” en direcciones oblicuas al sistema de coordenadas.
### Ruido anisotrópico o correlacionado
# Si las fluctuaciones (ruido térmico o forzado) en x e y están correlacionadas,
# por ejemplo, el vector de ruido:
# [ξx​(t)ξy​(t)​]  con  ⟨ξx​(t)ξy​(t′)⟩=ρδ(t−t′)
# implica que:
# D(2)=[Dx && ρ*sqrt(DxDy) // ρ*sqrt(DxDy) && Dy]
# Esto es común en sistemas con acoplamiento hidrodinámico, flujo de fluidos, o ruido direccional
# (por ejemplo, en microswimmers o partículas activas).
### Geometría curvada o coordenadas no cartesianas
# Si la dinámica ocurre sobre una superficie curvada (cilindro, esfera, etc.), los ejes locales no son ortogonales en todo el espacio.
# En coordenadas generalizadas, el tensor de difusión incluye términos de métrica cruzados.
### Sistemas con fuerzas no conservativas o campos rotacionales
# Si hay un campo de fuerzas no derivable de un potencial escalar (por ejemplo, un flujo circular, un torque magnético, o fuerzas de Lorentz), entonces el drift tiene componentes cruzadas
# vec(f) = [f_x, f_y] = [-\gammax + \Omega y, -\gammay + \Omega x]
# Este es un campo rotacional (como un vórtice o rotación).
# → Aquí el drift acopla ambas direcciones de manera intrínseca.
# 
# Se observa en sistemas con rotación, campos magnéticos, flujos vorticiales, etc.
### Dinámica colectiva o sistemas multi-partícula
# Cuando observas un grado de libertad efectivo (por ejemplo, el centro de masa de un conjunto de partículas), 
# los movimientos internos pueden generar correlaciones efectivas entre ejes.
# → El acoplamiento aparece incluso si el ruido original era isotrópico

def perform_pca(trajectory):
    """Perform PCA on trajectory data."""
    n_crom = trajectory.shape[0]
    trajectory_x_pca = []
    trajectory_y_pca = []
    
    for i in range(n_crom):
        data = trajectory[i, :, :]  # shape (time, 2)
        mean = data.mean(axis=0)
        centered = data - mean
        U, S, Vt = np.linalg.svd(centered, full_matrices=False)
        new_traj = centered.dot(Vt.T)  # shape (time, 2)
        trajectory_x_pca.append(new_traj[:, 0])
        trajectory_y_pca.append(new_traj[:, 1])
        
    return np.array(trajectory_x_pca), np.array(trajectory_y_pca)

def main():
    """Main execution function."""
    args = setup_argparse()
    configure_matplotlib()
    
    # Create PlotOptions object to pass to analysis functions
    plot_options = {
        'pdf': args.plot_pdf or args.plot_all,
        'acf': args.plot_acf or args.plot_all,
        'log_acf': args.plot_log_acf or args.plot_all,
        'markov': args.plot_markov or args.plot_all,
        'drift_diff': args.plot_drift_diff or args.plot_all,
        'kde': args.plot_kde or args.plot_all
    }
    
    # Ensure output directory exists
    if not os.path.exists(BASE_DIR):
        os.makedirs(BASE_DIR, exist_ok=True)
    
    # Load and prepare data
    datos_reales_alive = loadmat(DATA_FILEPATH)
    trajectory_real_alive = datos_reales_alive["Expression1"]
    scaled_trajectory = trajectory_real_alive * LENGTH_SCALE
    
    # Extract coordinates
    trajectory_x_real = scaled_trajectory[:, :, 0]
    trajectory_y_real = scaled_trajectory[:, :, 1]
    
    # Perform PCA
    trajectory_x_real_PCA_new, trajectory_y_real_PCA_new = perform_pca(scaled_trajectory)
    
    # Create trajectory lists for mapping
    traj_x_list = [trajectory_x_real[i] for i in range(trajectory_x_real.shape[0])]
    traj_y_list = [trajectory_y_real[i] for i in range(trajectory_y_real.shape[0])]
    
    dt = 1 / SAMPLING_FREQUENCY

    # Generate chromatin map if requested
    if args.plot_map or args.plot_all:
        plot_chromatin_map(traj_x_list, traj_y_list, color_by='time', base_dir=BASE_DIR)
    
    # If specific chromatin and component were specified, perform KDE validation
    if args.chromatin is not None and args.component is not None:
        crom = args.chromatin
        output_dir = os.path.join(BASE_DIR, f"cromatin_{crom}")
        os.makedirs(output_dir, exist_ok=True)
        
        # Select trajectory based on type and component
        if args.trajectory_type == 'pca':
            trajectory = (trajectory_x_real_PCA_new[crom] if args.component == 'X' 
                        else trajectory_y_real_PCA_new[crom])
        else:  # real
            trajectory = (trajectory_x_real[crom] if args.component == 'X' 
                        else trajectory_y_real[crom])
        
        # Define lag values for KDE validation
        lag_values_int = np.unique(np.round(np.logspace(0, 3, 30)).astype(int))
        if plot_options['kde']:
            analyze_kde_validation(trajectory, lag_values_int, output_dir, crom, args.component)
            print(f"KDE validation plots have been saved in {output_dir}")
        else:
            #Usual analysis
            analyze_trajectory(
            trajectory, dt, TIME_MAX, args.component, crom, 
            args.trajectory_type, output_dir, LENGTH_SCALE, 
            plot_options=plot_options
            )
        return    
        ## Fix Arguments for a single cromatin analysis (supposedly fixed)

    # Process all chromatin trajectories
    n_crom = trajectory_real_alive.shape[0]

    for crom in tqdm(range(n_crom), desc="Chromatin Bundles"):
        output_dir = os.path.join(BASE_DIR, f"cromatin_{crom}")
        os.makedirs(output_dir, exist_ok=True)
        
        for axis in tqdm([0, 1], desc="Coordinates", leave=False):
            coord_lab = "X" if axis == 0 else "Y"
            
            # Select trajectory based on type
            if args.trajectory_type == 'pca':
                X_series = trajectory_x_real_PCA_new[crom] if axis == 0 else trajectory_y_real_PCA_new[crom]
            else:  # real
                X_series = trajectory_x_real[crom] if axis == 0 else trajectory_y_real[crom]
            
            analyze_trajectory(
                X_series, dt, TIME_MAX, coord_lab, crom, 
                args.trajectory_type, output_dir, LENGTH_SCALE, 
                plot_options=plot_options
            )

if __name__ == "__main__":
    main()