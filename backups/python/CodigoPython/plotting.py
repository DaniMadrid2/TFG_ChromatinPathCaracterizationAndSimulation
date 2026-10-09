"""
Plotting functions for chromatin trajectory analysis.
"""

import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.cm as cm
from matplotlib.collections import LineCollection
from scipy.ndimage import convolve1d
from scipy.signal.windows import gaussian
import matplotlib.colors as mcolors
from matplotlib.colors import LogNorm
from config import COLOR_MAP, TIME_MAX


def smooth_dkl(x, sigma=5):
    """
    Smooth data using a Gaussian filter.
    
    Parameters:
    -----------
    x : array-like
        Data to smooth
    sigma : float
        Standard deviation for Gaussian kernel
        
    Returns:
    --------
    array-like
        Smoothed data
    """
    window = gaussian(sigma * 8 + 1, sigma)
    window = window / window.sum()
    return convolve1d(x, window)

def plot_kde_validation(x, density, grid, ax, title):
    """Plot 1D KDE validation."""
    hist_kwargs = dict(density=True, bins=30, alpha=0.6, color='gray')
    ax.hist(x, **hist_kwargs)
    ax.plot(grid, density, 'r-', lw=2, label='KDE')
    ax.set_title(title)
    ax.set_xlabel('x')
    ax.set_ylabel('Density')
    ax.grid(True)
    ax.legend()

def plot_2d_kde_validation(x1, x2, density, grid1, grid2, ax, title):
    """Plot 2D KDE validation."""
    scatter_kwargs = dict(alpha=0.6, color='gray', s=10)
    ax.scatter(x1, x2, **scatter_kwargs)
    X, Y = np.meshgrid(grid1, grid2)
    levels = np.linspace(0, density.max(), 10)
    ax.contour(X, Y, density.T, levels=levels, colors='r')
    ax.set_title(title)
    ax.set_xlabel('$x(t)$')
    ax.set_ylabel('$x(t+\\tau)$')
    ax.grid(True)

def plot_chromatin_map(traj_x, traj_y, matrix_speed=None, indices=None, color_by='time', base_dir='.'):
    """Generate map of heterochromatin bundles with coloring by time or speed."""
    lengths = [len(traj) for traj in traj_x]
    time_steps_per_series = [np.linspace(0, TIME_MAX, length) for length in lengths]

    df = pd.DataFrame({
        'x': np.concatenate(traj_x),
        'y': np.concatenate(traj_y),
        'serie': np.repeat(np.arange(len(traj_x)), lengths),
        'time': np.concatenate(time_steps_per_series)
    })

    if color_by == 'speed' and matrix_speed is not None:
        df['speed'] = np.concatenate([np.append(speed_series, np.nan) for speed_series in matrix_speed])
    
    if indices is not None:
        df = df[df['serie'].isin(indices)]

    plt.figure(figsize=(10, 8))

    colormap = cm.viridis
    if color_by == 'time':
        norm = mcolors.Normalize(vmin=0, vmax=TIME_MAX)
        color_label = 't (s)'
        color_values = 'time'
    elif color_by == 'speed' and matrix_speed is not None:
        min_speed = np.nanmin(matrix_speed[matrix_speed > 0])
        max_speed = np.nanmax(matrix_speed)
        norm = LogNorm(vmin=min_speed, vmax=max_speed)
        color_label = 'Log Speed (m/s)'
        color_values = 'speed'
    else:
        raise ValueError("Invalid color_by value or missing speed matrix")

    sm = cm.ScalarMappable(cmap=colormap, norm=norm)
    sm.set_array([])

    unique_series = df['serie'].unique()
    
    pca_info_dir = os.path.join(base_dir, "pca_info")
    os.makedirs(pca_info_dir, exist_ok=True)
    
    for serie in unique_series:
        series_data = df[df['serie'] == serie].sort_values(by='time')
        points = np.array([series_data['x'].values, series_data['y'].values]).T.reshape(-1, 1, 2)
        segments = np.concatenate([points[:-1], points[1:]], axis=1)
        lc = LineCollection(segments, cmap=colormap, norm=norm)
        lc.set_array(series_data[color_values].values)
        lc.set_linewidth(2)
        plt.gca().add_collection(lc)

        # Draw PCA directions
        series_points = df[df['serie'] == serie][['x', 'y']].values
        mean = series_points.mean(axis=0)
        cov = np.cov(series_points, rowvar=False)
        eigvals, eigvecs = np.linalg.eig(cov)
        order = np.argsort(eigvals)[::-1]
        eigvals = eigvals[order]
        eigvecs = eigvecs[:, order]

        scale = 3.0
        for i in range(2):
            dx = scale * np.sqrt(eigvals[i]) * eigvecs[0, i]
            dy = scale * np.sqrt(eigvals[i]) * eigvecs[1, i]
            plt.arrow(mean[0], mean[1], dx, dy, color='red', alpha=0.8, 
                     head_width=0.1, length_includes_head=True, zorder=10)

        plt.text(mean[0], mean[1], str(serie), fontsize=13, ha='center', va='bottom')
        
        # Save PCA information
        angle1 = np.degrees(np.arctan2(eigvecs[1, 0], eigvecs[0, 0]))
        angle2 = np.degrees(np.arctan2(eigvecs[1, 1], eigvecs[0, 1]))
        
        pca_filename = os.path.join(pca_info_dir, f"HC_PC_bundle_{serie}_{color_by}.txt")
        with open(pca_filename, "w") as f:
            f.write(f"Trajectory (Serie) {serie} PCA Information:\n")
            f.write(f"Mean: {mean.tolist()}\n")
            f.write("Covariance Matrix:\n")
            f.write(np.array2string(cov, precision=6, separator=', ') + "\n")
            f.write(f"Eigenvalues (sorted): {eigvals.tolist()}\n")
            f.write("Eigenvectors (columns correspond to eigenvectors):\n")
            f.write(np.array2string(eigvecs, precision=6, separator=', ') + "\n")
            f.write(f"Angle of Principal Component 1: {angle1:.2f} degrees\n")
            f.write(f"Angle of Principal Component 2: {angle2:.2f} degrees\n")

    cbar = plt.colorbar(sm, ax=plt.gca(), orientation='vertical')
    cbar.set_label(color_label)

    plt.title('Map of heterochromatin bundles')
    plt.xlabel('x (pixels)')
    plt.ylabel('y (pixels)')
    plt.gca().autoscale(enable=True)
    plt.tight_layout()

    file_name = os.path.join(base_dir, f"HC_map_{len(unique_series)}_{color_by}.svg")
    plt.savefig(file_name, format="svg")
    plt.close('all')

def plot_analysis_results(centers, p_hist, f_KM, a_KM, f_err, a_err, 
                         f_vals_list, a_vals_list, optimization_costs_list,
                         kl_divergences_list, best_indices, tau_coarse,
                         crom, real_pca_label, coord_lab, output_dir, stride):
    """Plot analysis results including drift, diffusion, and best models."""
    # Best models plot
    plt.figure(figsize=(14, 6))
    plt.suptitle(fr"Cromatin {crom}, {real_pca_label} trajectory: {coord_lab}, $\tau={tau_coarse:.3g}$", fontsize=12)
    
    best_colors = plt.cm.viridis(np.linspace(0, 1, len(best_indices)))
    
    plt.subplot(121)
    plt.errorbar(centers, f_KM, f_err, fmt='^', markersize=6, color='k', label=fr"K-M ($\tau={tau_coarse:.3g}$)")
    for color, idx in zip(best_colors, best_indices):
        f_vals = f_vals_list[idx]
        plt.plot(centers, f_vals, color=color, lw=2, label=f"Subsamp {idx+1}")
    plt.title("Drift")
    plt.xlabel("$x$", fontsize=24)
    plt.ylabel("$f(x)$", fontsize=24)
    plt.ylim([-15, 15])
    plt.grid()
    plt.legend()
    
    plt.subplot(122)
    plt.errorbar(centers, a_KM, a_err, fmt='^', markersize=6, color='k', label=fr"K-M ($\tau={tau_coarse:.3g}$)")
    for color, idx in zip(best_colors, best_indices):
        a_vals = a_vals_list[idx]
        plt.plot(centers, a_vals, color=color, lw=2, label=f"Subsamp {idx+1}")
    plt.title("Diffusion")
    plt.xlabel("$x$", fontsize=24)
    plt.ylabel("$a(x)$", fontsize=24)
    plt.ylim([-1, 10])
    plt.grid()
    plt.legend()
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, f"drift_diff_pred_bundle_{crom}_coord_{coord_lab}_{real_pca_label}_{stride}_best.svg"),
                format="svg", bbox_inches="tight")
    plt.close()

def plot_cross_correlation(optimization_costs_list, kl_divergences_list, 
                         crom, real_pca_label, coord_lab, tau_coarse, output_dir, stride):
    """Plot cross-correlation analysis between optimization costs and KL divergences."""
    from scipy.stats import spearmanr, rankdata
    from config import DISPLAY_PERCENTAGE

    # Convert inputs to numpy arrays for proper indexing
    optimization_costs = np.array(optimization_costs_list)
    kl_divergences = np.array(kl_divergences_list)
    
    subsample_indices = np.arange(1, len(optimization_costs) + 1)
    
    fig, (ax1, ax2, ax3, ax4) = plt.subplots(4, 1, figsize=(10, 10), sharex=False)
    plt.suptitle(fr"Cromatin {crom}, {real_pca_label} trajectory: {coord_lab}, $\tau={tau_coarse:.3g}$", fontsize=12)

    # Optimization Cost plot
    ax1.plot(subsample_indices, optimization_costs, marker="o", linestyle="-", color="b", markersize=6)
    ax1.set_title("Optimization Cost", fontsize=12)
    ax1.set_ylabel("Cost", fontsize=12)
    ax1.grid(True)

    # KL Divergence plot
    ax2.plot(subsample_indices, kl_divergences, marker="o", linestyle="-", color="g", markersize=6)
    ax2.set_title("KL Divergence", fontsize=12)
    ax2.set_ylabel("KL Divergence", fontsize=12)
    ax2.set_xlabel("Subsample Index", fontsize=12)
    ax2.grid(True)

    # Compute Spearman correlation
    spearman_corr, _ = spearmanr(optimization_costs, kl_divergences)

    # Compute cross-correlation on ranked values
    ranked_opt_costs = rankdata(optimization_costs)
    ranked_kl_divs = rankdata(kl_divergences)
    xcorr = np.correlate(ranked_opt_costs - np.mean(ranked_opt_costs),
                        ranked_kl_divs - np.mean(ranked_kl_divs),
                        mode="full") / (len(ranked_opt_costs) * np.std(ranked_opt_costs) * np.std(ranked_kl_divs))
    lags = np.arange(-len(subsample_indices) + 1, len(subsample_indices))
    ax3.plot(lags, xcorr, marker="o", linestyle="-", color="r", markersize=4)
    ax3.set_title("Cross-Correlation", fontsize=12)
    ax3.set_xlabel("Lag", fontsize=12)
    ax3.set_ylabel("Cross-Corr", fontsize=12)
    ax3.grid(True)
    ax3.text(0.05, 0.95, f"Spearman corr.: {spearman_corr:.3f}", transform=ax3.transAxes,
             fontsize=12, verticalalignment="top", bbox=dict(boxstyle="round", facecolor="wheat", alpha=0.5))

    # Calculate statistics for best models
    num_models = len(optimization_costs)
    num_best_models = max(1, int(np.ceil(num_models * DISPLAY_PERCENTAGE / 100)))
    sorted_indices = np.argsort(optimization_costs)
    best_indices = sorted_indices[:num_best_models]
    best_costs = optimization_costs[best_indices]

    # Create histogram of best models in main subplot
    ax4.hist(best_costs, bins='auto', color='blue', alpha=0.7)
    ax4.set_title(f"AFP Optimization Cost Distribution (Best {DISPLAY_PERCENTAGE}%)", fontsize=12)
    ax4.set_xlabel("Cost", fontsize=12)
    ax4.set_ylabel("Frequency", fontsize=12)
    ax4.grid(True)

    # Add mean and standard deviation lines for best models
    mean_cost_best = np.mean(best_costs)
    std_cost_best = np.std(best_costs)
    ax4.axvline(mean_cost_best, color='r', linestyle='--', label=f'Mean = {mean_cost_best:.2f}')
    ax4.axvline(mean_cost_best + std_cost_best, color='g', linestyle=':', label=f'Mean ± SD = {std_cost_best:.2f}')
    ax4.axvline(mean_cost_best - std_cost_best, color='g', linestyle=':')
    ax4.legend()

    # Add inset with histogram of all costs using log scale
    axins = ax4.inset_axes([0.6, 0.6, 0.35, 0.35])
    # Filter out infinite values only for histogram
    finite_mask = np.isfinite(optimization_costs)
    finite_costs = optimization_costs[finite_mask]
    if len(finite_costs) > 0:
        axins.hist(finite_costs, bins='auto', color='gray', alpha=0.7)
    axins.set_title("All Costs", fontsize=10)
    axins.grid(True)
    axins.set_xscale('log')

    # Add mean and standard deviation lines for all costs
    if len(finite_costs) > 0:
        mean_cost_all = np.mean(finite_costs)
        std_cost_all = np.std(finite_costs)
        axins.axvline(mean_cost_all, color='r', linestyle='--')
        if mean_cost_all - std_cost_all > 0:  # Only plot if positive
            axins.axvline(mean_cost_all + std_cost_all, color='g', linestyle=':')
            axins.axvline(mean_cost_all - std_cost_all, color='g', linestyle=':')

    plt.tight_layout()
    plt.subplots_adjust(hspace=0.4)
    
    plt.savefig(os.path.join(output_dir, f"cost_analysis_{crom}_coord_{coord_lab}_{real_pca_label}_{stride}.svg"),
                format="svg", bbox_inches="tight")
    plt.close()

def plot_markov_test(lag_filtered, kl_div_valid, minima_lag, minima_kl_div,
                    lag_filtered_conj, kl_div_conj_valid, minima_lag_conj, minima_kl_div_conj,
                    lag_filtered_sym, kl_div_sym_valid, minima_lag_sym, minima_kl_div_sym,
                    dt, crom, real_pca_label, coord_lab, output_dir):
    
    """Plot Markov test results with three KL divergence versions."""
    plt.figure(figsize=(12, 6))
    plt.suptitle(f"Chromatin {crom}, {real_pca_label} trajectory:{coord_lab}", fontsize=12)
    plt.gca().set_xscale('log')

    # Calculate smoothed versions of the KL divergences
    smooth_kl = smooth_dkl(kl_div_valid)
    smooth_kl_conj = smooth_dkl(kl_div_conj_valid)
    smooth_kl_sym = smooth_dkl(kl_div_sym_valid)

    # Find minima in smoothed versions
    from scipy.signal import argrelextrema
    from config import WINDOW_SIZE

    smooth_minima_indices = argrelextrema(smooth_kl, np.less, order=WINDOW_SIZE)[0]
    smooth_minima_indices_conj = argrelextrema(smooth_kl_conj, np.less, order=WINDOW_SIZE)[0]
    smooth_minima_indices_sym = argrelextrema(smooth_kl_sym, np.less, order=WINDOW_SIZE)[0]

    smooth_minima_lag = lag_filtered[smooth_minima_indices]
    smooth_minima_lag_conj = lag_filtered_conj[smooth_minima_indices_conj]
    smooth_minima_lag_sym = lag_filtered_sym[smooth_minima_indices_sym]

    smooth_minima_kl = smooth_kl[smooth_minima_indices]
    smooth_minima_kl_conj = smooth_kl_conj[smooth_minima_indices_conj]
    smooth_minima_kl_sym = smooth_kl_sym[smooth_minima_indices_sym]

    # Plot original KL divergence and its minima with transparency
    plt.plot(dt * lag_filtered, kl_div_valid, 'k-', label=r'$D(P||Q)$', alpha=0.3)
    #plt.plot(dt * minima_lag, minima_kl_div, 'ko', label=r'Local minima $D(P||Q)$')
    #for x, y, lag_val in zip(dt * minima_lag, minima_kl_div, minima_lag):
    #    plt.text(x, y, f'{lag_val*dt:.3g},{lag_val}', ha='right', va='bottom', fontsize=8)

    # Plot conjugate KL divergence and its minima with transparency
    plt.plot(dt * lag_filtered_conj, kl_div_conj_valid, 'b-', label=r'$D(Q||P)$', alpha=0.3)
    #plt.plot(dt * minima_lag_conj, minima_kl_div_conj, 'bo', label=r'Local minima $D(Q||P)$')
    #for x, y, lag_val in zip(dt * minima_lag_conj, minima_kl_div_conj, minima_lag_conj):
    #    plt.text(x, y, f'{lag_val*dt:.3g},{lag_val}', ha='right', va='top', fontsize=8)

    # Plot symmetrized KL divergence and its minima with transparency
    plt.plot(dt * lag_filtered_sym, kl_div_sym_valid, 'r-', label=r'$D_{\mathrm{sym}}$', alpha=0.3)
    #plt.plot(dt * minima_lag_sym, minima_kl_div_sym, 'ro', label=r'Local minima $D_{\mathrm{sym}}$')
    #for x, y, lag_val in zip(dt * minima_lag_sym, minima_kl_div_sym, minima_lag_sym):
    #    plt.text(x, y, f'{lag_val*dt:.3g},{lag_val}', ha='left', va='bottom', fontsize=8)

    # Plot smoothed versions with their minima (on top, with full opacity)
    plt.plot(dt * lag_filtered, smooth_kl, 'k--', label=r'Smoothed $D(P||Q)$', linewidth=2)
    plt.plot(dt * smooth_minima_lag, smooth_minima_kl, 'kx', markersize=8)
    for x, y, lag_val in zip(dt * smooth_minima_lag, smooth_minima_kl, smooth_minima_lag):
        plt.text(x, y, f'{lag_val*dt:.3g},{lag_val}', ha='right', va='top', fontsize=8, color='black')

    plt.plot(dt * lag_filtered_conj, smooth_kl_conj, 'b--', label=r'Smoothed $D(Q||P)$', linewidth=2)
    plt.plot(dt * smooth_minima_lag_conj, smooth_minima_kl_conj, 'bx', markersize=8)
    for x, y, lag_val in zip(dt * smooth_minima_lag_conj, smooth_minima_kl_conj, smooth_minima_lag_conj):
        plt.text(x, y, f'{lag_val*dt:.3g},{lag_val}', ha='right', va='bottom', fontsize=8, color='blue')

    plt.plot(dt * lag_filtered_sym, smooth_kl_sym, 'r--', label=r'Smoothed $D_{\mathrm{sym}}$', linewidth=2)
    plt.plot(dt * smooth_minima_lag_sym, smooth_minima_kl_sym, 'rx', markersize=8)
    for x, y, lag_val in zip(dt * smooth_minima_lag_sym, smooth_minima_kl_sym, smooth_minima_lag_sym):
        plt.text(x, y, f'$\\tau={lag_val*dt:.3g}$,lag={lag_val}', ha='left', va='top', fontsize=8, color='red')

    plt.ylabel(r'$\mathcal{D}_{KL}(\tau)$')
    plt.xlabel(r'$\tau$')
    plt.xlim([1e-2, 1.5])
    plt.semilogy()
    plt.grid(True)
    plt.legend(ncol=2, fontsize=8)

    markov_test_fig_path = os.path.join(output_dir, f"markov_test_bundle_{crom}_coord_{coord_lab}_{real_pca_label}.svg")
    plt.savefig(markov_test_fig_path, format="svg", bbox_inches='tight', dpi=300)
    plt.close()

def plot_pdf_fits(centers, p_hist, fp_obj, f_vals_list, a_vals_list, best_indices,
                  crom, real_pca_label, coord_lab, stride, output_dir):
    """Plot best fits to the experimental PDF."""
    best_colors = plt.cm.viridis(np.linspace(0, 1, len(best_indices)))
    
    plt.figure(figsize=(8, 6))
    plt.suptitle(f"Cromatin {crom}, {real_pca_label} trajectory: {coord_lab} (Best PDF fits)", fontsize=12)
    plt.plot(centers, p_hist, label='Data', lw=3, color='black')
    
    for color, idx in zip(best_colors, best_indices):
        f_vals = f_vals_list[idx]
        a_vals = a_vals_list[idx]
        p_fit = fp_obj.solve(f_vals, a_vals)
        plt.plot(centers, p_fit, '-', lw=2, color=color, label=f"Subsamp {idx+1}")
    
    plt.xlabel("$x$", fontsize=24)
    plt.ylabel("$p(x)$", fontsize=24)
    plt.grid()
    plt.legend(fontsize=10, ncol=2, loc="upper center", bbox_to_anchor=(0.5, -0.15))
    
    pdf_est_fig_path = os.path.join(output_dir, 
                                   f"exp_th_dist_AFPopt_bundle_{crom}_coord_{coord_lab}_{real_pca_label}_{stride}_best_pdf.svg")
    plt.savefig(pdf_est_fig_path, format="svg", bbox_inches="tight")
    plt.close()