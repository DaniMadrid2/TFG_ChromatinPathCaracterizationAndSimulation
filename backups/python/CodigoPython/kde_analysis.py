"""
KDE validation and analysis functions for chromatin trajectories.
"""

import os
import numpy as np
from KDEpy import FFTKDE
import matplotlib.pyplot as plt
from scipy.io import savemat
from plotting import plot_kde_validation, plot_2d_kde_validation
from config import SAMPLING_FREQUENCY, KDE_PADDING_PERCENTAGE  # Import KDE_PADDING_PERCENTAGE

def silverman_rule_md(data):
    """
    Compute Silverman's rule of thumb for multivariate data.
    
    Parameters:
    -----------
    data : array-like of shape (n_samples, n_dimensions)
        Input data
    
    Returns:
    --------
    float : Optimal bandwidth according to Silverman's rule
    """
    data = np.asarray(data)
    n, d = data.shape
    sigma = np.std(data, axis=0)
    sigma_g = np.prod(sigma) ** (1/d)
    h = sigma_g * (4/(d+2))**(1/(d+4)) * n**(-1/(d+4))
    return h

def analyze_kde_validation(trajectory, lag_values, output_dir, crom_idx, coord_label):
    """
    Analyze a specific trajectory for markov test with KDE validation plots using FFTKDE.
    
    Parameters:
    -----------
    trajectory : array-like
        The trajectory data to analyze
    lag_values : array-like
        Array of lag values to use for analysis
    output_dir : str
        Directory to save output files
    crom_idx : int
        Chromatin index
    coord_label : str
        Coordinate label (X or Y)
    """
    dt = 1/SAMPLING_FREQUENCY

    for lag_idx, example_lag in enumerate(lag_values):
        # Calculate points maintaining equal lengths
        n_points = len(trajectory) - 2*example_lag
        X1 = trajectory[:n_points:example_lag]
        X2 = trajectory[example_lag:n_points+example_lag:example_lag]
        X3 = trajectory[2*example_lag:n_points+2*example_lag:example_lag]
        
        assert len(X1) == len(X2) == len(X3), "Arrays must have equal length"
        
        # Set up evaluation grid
        global_min = min(X1.min(), X2.min(), X3.min())
        global_max = max(X1.max(), X2.max(), X3.max())
        total_range = global_max - global_min
        
        # Use KDE_PADDING_PERCENTAGE instead of hardcoded 0.2
        padding = (KDE_PADDING_PERCENTAGE / 100) * total_range
        global_min -= padding
        global_max += padding
        grid_points = 400
        
        grid1 = np.linspace(global_min, global_max, grid_points)
        grid2 = np.linspace(global_min, global_max, grid_points)
        grid3 = np.linspace(global_min, global_max, grid_points)
        dx = grid1[1] - grid1[0]
        
        # Compute optimal bandwidths
        data12 = np.column_stack([X1, X2])
        data23 = np.column_stack([X2, X3])
        bw12 = silverman_rule_md(data12)
        bw23 = silverman_rule_md(data23)
        bw2 = silverman_rule_md(X2.reshape(-1, 1))
        data123 = np.column_stack([X1, X2, X3])
        bw123 = silverman_rule_md(data123)
        
        # 1D and 2D KDE computations
        kde2 = FFTKDE(bw=bw2, kernel='gaussian').fit(X2.reshape(-1, 1))
        density2 = kde2.evaluate(grid2.reshape(-1, 1))

        kde12 = FFTKDE(bw=bw12, kernel='gaussian').fit(data12)
        grid12_x, grid12_y = np.meshgrid(grid1, grid2, indexing='ij')
        points12 = np.column_stack([grid12_x.ravel(), grid12_y.ravel()])
        density12 = kde12.evaluate(points12).reshape(grid_points, grid_points)

        kde23 = FFTKDE(bw=bw23, kernel='gaussian').fit(data23)
        grid23_x, grid23_y = np.meshgrid(grid2, grid3, indexing='ij')
        points23 = np.column_stack([grid23_x.ravel(), grid23_y.ravel()])
        density23 = kde23.evaluate(points23).reshape(grid_points, grid_points)

        # Save distributions and grids to .mat file
        distributions_data = {
            'grid1': grid1,
            'grid2': grid2,
            'grid3': grid3,
            'density1D': density2,
            'density2D_12': density12,
            'density2D_23': density23,
            'X1': X1,
            'X2': X2,
            'X3': X3,
            'dt': dt,
            'lag': example_lag,
            'physical_time': example_lag * dt,
            'bandwidth_1D': bw2,
            'bandwidth_2D_12': bw12,
            'bandwidth_2D_23': bw23
        }
        
        mat_filename = os.path.join(output_dir, f"kde_distributions_crom_{crom_idx}_{coord_label}_lag_{example_lag}.mat")
        savemat(mat_filename, distributions_data)

        # 1D KDE Validation
        fig_kde1d = plt.figure(figsize=(8, 6))
        ax4 = fig_kde1d.add_subplot(111)
        kde2 = FFTKDE(bw=bw2, kernel='gaussian').fit(X2.reshape(-1, 1))
        density2 = kde2.evaluate(grid2.reshape(-1, 1))
        hist_kwargs = dict(density=True, bins=30, alpha=0.6, color='gray')
        ax4.hist(X2, **hist_kwargs)
        ax4.plot(grid2, density2, 'r-', lw=2, label='KDE')
        ax4.set_title(f'1D KDE Validation ($\\tau={example_lag*dt:.2f}$)')
        ax4.set_xlabel('x')
        ax4.set_ylabel('Density')
        ax4.grid(True)
        ax4.legend()
        plt.tight_layout()
        output_fig4 = os.path.join(output_dir, 
                                  f"kde_1d_validation_crom_{crom_idx}_{coord_label}_lag_{example_lag}.svg")
        plt.savefig(output_fig4, dpi=300, bbox_inches='tight', format='svg')
        plt.close()
        
        # 2D KDE Validation (X1, X2)
        fig_kde2d_12 = plt.figure(figsize=(8, 6))
        ax5 = fig_kde2d_12.add_subplot(111)
        kde12 = FFTKDE(bw=bw12, kernel='gaussian').fit(data12)
        grid12_x, grid12_y = np.meshgrid(grid1, grid2, indexing='ij')
        points12 = np.column_stack([grid12_x.ravel(), grid12_y.ravel()])
        density12 = kde12.evaluate(points12).reshape(grid_points, grid_points)
        ax5.scatter(X1, X2, alpha=0.6, color='gray', s=10)
        levels = np.linspace(0, density12.max(), 10)
        ax5.contour(grid12_x, grid12_y, density12, levels=levels, colors='r')
        ax5.set_title(f'2D KDE Validation (t, t+{example_lag*dt:.2f})')
        ax5.set_xlabel('$x(t)$')
        ax5.set_ylabel('$x(t+\\tau)$')
        ax5.grid(True)
        plt.tight_layout()
        output_fig5 = os.path.join(output_dir, 
                                  f"kde_2d_validation_12_crom_{crom_idx}_{coord_label}_lag_{example_lag}.svg")
        plt.savefig(output_fig5, dpi=300, bbox_inches='tight', format='svg')
        plt.close()
        
        # 2D KDE Validation (X2, X3)
        fig_kde2d_23 = plt.figure(figsize=(8, 6))
        ax6 = fig_kde2d_23.add_subplot(111)
        kde23 = FFTKDE(bw=bw23, kernel='gaussian').fit(data23)
        grid23_x, grid23_y = np.meshgrid(grid2, grid3, indexing='ij')
        points23 = np.column_stack([grid23_x.ravel(), grid23_y.ravel()])
        density23 = kde23.evaluate(points23).reshape(grid_points, grid_points)
        ax6.scatter(X2, X3, alpha=0.6, color='gray', s=10)
        ax6.contour(grid23_x, grid23_y, density23, levels=levels, colors='r')
        ax6.set_title(f'2D KDE Validation (t+{example_lag*dt:.2f}, t+{2*example_lag*dt:.2f})')
        ax6.set_xlabel('$x(t+\\tau)$')
        ax6.set_ylabel('$x(t+2\\tau)$')
        ax6.grid(True)
        plt.tight_layout()
        output_fig6 = os.path.join(output_dir,
                                  f"kde_2d_validation_23_crom_{crom_idx}_{coord_label}_lag_{example_lag}.svg")
        plt.savefig(output_fig6, dpi=300, bbox_inches='tight', format='svg')
        plt.close()
        
        # Compute and save Markov property validation
        try:
            # KDE for (X1, X2)
            kde12 = FFTKDE(bw=bw12, kernel='gaussian').fit(data12)
            p12 = kde12.evaluate(points12).reshape(grid_points, grid_points)
            p12 = np.clip(p12, 1e-10, None)
            p12 /= np.sum(p12) * dx * dx
            
            # KDE for (X2, X3)
            kde23 = FFTKDE(bw=bw23, kernel='gaussian').fit(data23)
            p23 = kde23.evaluate(points23).reshape(grid_points, grid_points)
            p23 = np.clip(p23, 1e-10, None)
            p23 /= np.sum(p23) * dx * dx
            
            # KDE for X2 (marginal)
            kde2 = FFTKDE(bw=bw2, kernel='gaussian').fit(X2.reshape(-1, 1))
            p2 = kde2.evaluate(grid2.reshape(-1, 1))
            p2 = np.clip(p2, 1e-10, None)
            p2 /= np.sum(p2) * dx
            
            # KDE for (X1, X2, X3)
            kde3 = FFTKDE(bw=bw123, kernel='gaussian').fit(data123)
            grid_mesh = np.meshgrid(grid1, grid2, grid3, indexing='ij')
            points123 = np.column_stack([g.ravel() for g in grid_mesh])
            p123 = kde3.evaluate(points123).reshape(grid_points, grid_points, grid_points)
            p123 = np.clip(p123, 1e-10, None)
            p123 /= np.sum(p123) * dx * dx * dx
            
            # Compute Markov approximation and KL divergence
            pcond_23 = p23 / p2[:, np.newaxis]
            p123_markov = np.einsum('ij,jk->ijk', p12, pcond_23)
            p123_markov /= np.sum(p123_markov) * dx * dx * dx
            
            p123_clipped = np.clip(p123, 1e-10, None)
            p123_markov_clipped = np.clip(p123_markov, 1e-10, None)
            kl_val = np.sum(p123_clipped * np.log(p123_clipped / p123_markov_clipped)) * (dx * dx * dx)
            
            # Save KL divergence value
            kl_file = os.path.join(output_dir, f"kl_divergence_lag_{example_lag}.txt")
            with open(kl_file, 'w') as f:
                f.write(f"Lag: {example_lag}\n")
                f.write(f"Physical time: {example_lag*dt:.3f}\n")
                f.write(f"KL divergence: {kl_val:.6e}\n")
                
        except Exception as e:
            print(f"KDE evaluation failed for lag {example_lag}: {str(e)}")
            continue