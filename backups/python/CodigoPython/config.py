"""
Configuration constants for the chromatin analysis.
"""

import os
import matplotlib as mpl
import matplotlib.pyplot as plt
from enum import Enum

# Define stride selection strategy
class StrideSelectionStrategy(Enum):
    FIRST_MINIMUM = 'first'
    GLOBAL_MINIMUM = 'global'
    ALL_MINIMA = 'all'

# Sampling and time constants
SAMPLING_FREQUENCY = 253.2  # Hz
TIME_STEP = 1 / SAMPLING_FREQUENCY
TIME_MAX = 10  # seconds
LENGTH_SCALE = 1  # pixels

# Analysis parameters
DISPLAY_PERCENTAGE = 20  # Percentage of subsampled sequences to display
WINDOW_SIZE = 50  # Window size for Markov test
KDE_PADDING_PERCENTAGE = 20  # Padding percentage for KDE analysis 
STRIDE_SELECTION = StrideSelectionStrategy.ALL_MINIMA  # Strategy for selecting stride #All minima

# Paths and files
ORIGINALS_PATH = r'C:/Users/danie/OneDrive/Escritorio/Teleco/TFG/CodigoPython/dataOrig/'
DATA_FILENAME = 'alive_1.mat'
TRAJECTORY_TYPE = "pca" 

# Derived paths
DATA_FILEPATH = os.path.join(ORIGINALS_PATH, DATA_FILENAME)
BASE_DIR = os.path.splitext(os.path.basename(DATA_FILENAME))[0]

# Matplotlib configuration
def configure_matplotlib():
    # mpl.rc('text', usetex=True)
    # mpl.rc('font', family='sans serif')
    # mpl.rc('xtick', labelsize=14)
    # mpl.rc('ytick', labelsize=14)
    # mpl.rc('axes', labelsize=20)
    # mpl.rc('axes', titlesize=20)
    # mpl.rc('figure', figsize=(6, 4))

    # Matplotlib configuration
    mpl.use('Agg')  # Use non-interactive backend
    mpl.rcParams['text.usetex'] = True
    mpl.rcParams['font.family'] = 'sans-serif'
    mpl.rcParams['font.sans-serif'] = ['DejaVu Sans']
    mpl.rcParams['axes.labelsize'] = 14
    mpl.rcParams['xtick.labelsize'] = 12
    mpl.rcParams['ytick.labelsize'] = 12
    mpl.rcParams['figure.titlesize'] = 16

# Color configuration
COLOR_LIST = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
              '#9467bd', '#8c564b', '#e377c2', '#7f7f7f',
              '#bcbd22', '#17becf']
COLOR_LIST[:2] = ["#000000", "#5891BF"]  # Black/blue
COLOR_MAP = mpl.colors.ListedColormap(COLOR_LIST)