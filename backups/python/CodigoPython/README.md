# LICh-DND (Langevin Inference of Chromatin trajectories for Determination of Nuclear cell Dynamics)

## Overview
LICh-DnD is a Python-based toolkit for analyzing chromatin dynamics through trajectory analysis, drift-diffusion estimation, and Markov property validation. The program implements advanced statistical methods to extract meaningful patterns from chromatin movement data.

## Project Structure
```
.
├── README.md
├── main.py                  # Main entry point and CLI interface
├── config.py               # Configuration parameters and settings
├── utils.py               # Utility functions for data processing
├── fpsolve.py            # Fokker-Planck equation solver
├── kde_analysis.py       # Kernel Density Estimation analysis
├── plotting.py           # Visualization functions
├── trajectory_analysis.py # Core trajectory analysis functions
└── requirements.txt      # Python dependencies
```

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

### Setting up a Virtual Environment
1. Create a new virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
- On Windows:
```bash
venv\Scripts\activate
```
- On macOS/Linux:
```bash
source venv/bin/activate
```

3. Install the required packages:
```bash
pip install -r requirements.txt
```

## Usage

### Basic Usage
1. Activate your virtual environment (if not already activated)
2. Run the main script:
```bash
python main.py [options]
```

### Command Line Options
- `--chromatin INT`: Analyze a specific chromatin index
- `--component {X,Y}`: Analyze a specific component (X or Y)
- Plot options:
  - `--plot-pdf`: Generate PDF state distribution plots
  - `--plot-acf`: Generate autocorrelation function plots
  - `--plot-log-acf`: Generate logarithm of ACF plots
  - `--plot-markov`: Generate Markov test plots
  - `--plot-drift-diff`: Generate drift-diffusion estimation plots
  - `--plot-kde`: Generate KDE validation plots
  - `--plot-map`: Generate chromatin map
  - `--plot-all`: Generate all plots

### Examples
1. Analyze all chromatins with all plots:
```bash
python main.py --plot-all
```

2. Analyze a specific chromatin's X component:
```bash
python main.py --chromatin 0 --component X --plot-kde --plot-markov
```

3. Generate only specific plots for all chromatins:
```bash
python main.py --plot-pdf --plot-acf --plot-markov
```

## Output
The program generates several types of output files:

1. Plot files (in SVG format):
   - PDF state distributions
   - Autocorrelation functions
   - Markov test results
   - Drift-diffusion estimations
   - KDE validations
   - Chromatin maps

2. Analysis files:
   - KL divergence values
   - Polynomial coefficients for drift and diffusion
   - PCA information

All outputs are organized in a directory structure based on the input data filename and chromatin index.

## Configuration
Key parameters can be modified in `config.py`:

### Time and Sampling Parameters
- `SAMPLING_FREQUENCY`: Data sampling frequency (Hz)
- `TIME_MAX`: Maximum time for analysis (seconds)
- `TIME_STEP`: Derived from sampling frequency (1/SAMPLING_FREQUENCY)

### Analysis Parameters
- `LENGTH_SCALE`: Scale factor for lengths (pixels)
- `DISPLAY_PERCENTAGE`: Percentage of subsampled sequences to display
- `WINDOW_SIZE`: Window size for Markov test
- `KDE_PADDING_PERCENTAGE`: Padding percentage for KDE analysis boundaries (e.g., 20 = 20%)
- `TRAJECTORY_TYPE`: Type of trajectory analysis ("pca" or "real")

### Path Configuration
- `ORIGINALS_PATH`: Path to original data files
- `DATA_FILENAME`: Name of the input .mat file

### Visualization
- Custom color configurations for plots
- LaTeX-enabled text rendering
- Configurable font sizes and figure dimensions

## Analysis Features
- Principal Component Analysis (PCA) of trajectories
- Kernel Density Estimation (KDE) validation of probability densities
- Markov property testing through KL divergence and optimal subsampling interval determination
- Drift and diffusion coefficient estimation
- Fokker-Planck equation solving
- Autocorrelation analysis
- Cross-correlation analysis of cost and fitness of solutions

## Data Format
The program expects input data in MATLAB .mat format with the following structure:
- Variable name: "Expression1"
- Dimensions: [n_chromatins, n_timepoints, 2]
- The last dimension contains [x, y] coordinates

## Visualization Options
All plots can be generated in SVG format for high-quality publication-ready figures. The program provides various visualization options:
- Time-based or speed-based coloring of trajectories
- PCA direction visualization
- Multiple KL divergence representations
- Drift-diffusion coefficient plots
- PDF comparisons
- Autocorrelation analysis plots

## Error Handling
The program includes error handling for:
- Invalid input data
- Missing directories
- KDE computation failures
- Invalid parameter combinations

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Citation
If you use this software in your research, please cite:
[Citation information to be added]

## Contact
antonio.caamano@urjc.es