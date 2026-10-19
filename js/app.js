/**
 * AI 8-Puzzle Visualizer - Application Controller & Event Bindings
 * Handles tab navigation, custom puzzle editor, presets, student details, and keyboard shortcuts.
 */

const App = {
    currentTab: 'game', // Default to interactive Game mode!

    init() {
        this.bindThemeSwitcher();
        this.bindNavigation();
        this.bindAlgorithmControls();
        this.bindPuzzleInput();
        this.bindPlaybackControls();
        this.bindStudentDetails();
        this.bindKeyboardShortcuts();
        this.loadPreset(0);
        this.switchTab('game');
    },

    // =========================================================================
    // TAB NAVIGATION
    // =========================================================================

    bindNavigation() {
        const tabs = ['home', 'game', 'visualizer', 'comparison', 'docs'];
        tabs.forEach(tab => {
            const btn = document.getElementById(`navTab_${tab}`);
            if (btn) {
                btn.addEventListener('click', () => this.switchTab(tab));
            }
        });
    },

    switchTab(tabId) {
        this.currentTab = tabId;
        const tabs = ['home', 'game', 'visualizer', 'comparison', 'docs'];

        tabs.forEach(tab => {
            const btn = document.getElementById(`navTab_${tab}`);
            const section = document.getElementById(`section_${tab}`);
            if (btn && section) {
                if (tab === tabId) {
                    btn.classList.add('active');
                    section.classList.remove('hidden');
                } else {
                    btn.classList.remove('active');
                    section.classList.add('hidden');
                }
            }
        });

        // Trigger chart rendering when switching to comparison
        if (tabId === 'comparison' && ComparisonModule.results.length > 0) {
            setTimeout(() => ComparisonModule.renderCharts(), 100);
        }

        // Render game board if entering game tab
        if (tabId === 'game' && window.gameEngine) {
            window.gameEngine.renderGameBoard();
        }
    },

    // =========================================================================
    // ALGORITHM SELECTION & DYNAMIC PARAMETERS
    // =========================================================================

    bindAlgorithmControls() {
        const algoSelect = document.getElementById('algorithmSelect');
        const heuristicSelect = document.getElementById('heuristicSelect');
        const dlsDepthInput = document.getElementById('dlsDepthInput');

        const heuristicContainer = document.getElementById('heuristicContainer');
        const depthLimitContainer = document.getElementById('depthLimitContainer');

        if (algoSelect) {
            algoSelect.addEventListener('change', (e) => {
                const algo = e.target.value;
                if (window.visualizer) {
                    window.visualizer.algorithm = algo;
                }

                if (algo === 'GBFS' || algo === 'A*') {
                    heuristicContainer.classList.remove('hidden');
                } else {
                    heuristicContainer.classList.add('hidden');
                }

                if (algo === 'DLS') {
                    depthLimitContainer.classList.remove('hidden');
                    document.getElementById('depthLimitLabel').textContent = 'Depth Limit (L):';
                } else if (algo === 'DFS') {
                    depthLimitContainer.classList.remove('hidden');
                    document.getElementById('depthLimitLabel').textContent = 'Max Depth Safeguard:';
                } else {
                    depthLimitContainer.classList.add('hidden');
                }

                document.getElementById('activeAlgorithmBadge').textContent = algo;
            });
        }

        if (heuristicSelect) {
            heuristicSelect.addEventListener('change', (e) => {
                if (window.visualizer) {
                    window.visualizer.heuristic = e.target.value;
                }
            });
        }

        if (dlsDepthInput) {
            dlsDepthInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0 && window.visualizer) {
                    window.visualizer.depthLimit = val;
                }
            });
        }
    },

    // =========================================================================
    // PUZZLE INPUT (Method 1: Custom / Preset, Method 2: Random Solvable)
    // =========================================================================

    bindPuzzleInput() {
        const presetSelect = document.getElementById('presetSelect');
        if (presetSelect) {
            presetSelect.innerHTML = '';
            Puzzle.PRESETS.forEach((preset, idx) => {
                const opt = document.createElement('option');
                opt.value = idx;
                opt.textContent = `${preset.name} [${preset.difficulty}]`;
                presetSelect.appendChild(opt);
            });

            presetSelect.addEventListener('change', (e) => {
                this.loadPreset(parseInt(e.target.value, 10));
            });
        }

        const btnRandom = document.getElementById('btnRandomPuzzle');
        if (btnRandom) {
            btnRandom.addEventListener('click', () => {
                if (!window.visualizer) return;
                const newInitial = Puzzle.generateRandomSolvable(window.visualizer.goalState, 20);
                window.visualizer.initialState = [...newInitial];
                window.visualizer.currentState = [...newInitial];
                window.visualizer.reset(true);
                window.visualizer.updateSolvabilityBadge();
            });
        }

        const btnCustom = document.getElementById('btnCustomInput');
        const modal = document.getElementById('customInputModal');
        const btnCloseModal = document.getElementById('btnCloseModal');
        const btnApplyModal = document.getElementById('btnApplyCustomInput');

        if (btnCustom && modal) {
            btnCustom.addEventListener('click', () => {
                document.getElementById('customInitialInput').value = window.visualizer.initialState.join(' ').replace(/0/g, '_');
                document.getElementById('customGoalInput').value = window.visualizer.goalState.join(' ').replace(/0/g, '_');
                this.validateModalInput();
                modal.classList.remove('hidden');
            });
        }

        if (btnCloseModal && modal) {
            btnCloseModal.addEventListener('click', () => modal.classList.add('hidden'));
        }

        const inputInit = document.getElementById('customInitialInput');
        const inputGoal = document.getElementById('customGoalInput');
        if (inputInit && inputGoal) {
            inputInit.addEventListener('input', () => this.validateModalInput());
            inputGoal.addEventListener('input', () => this.validateModalInput());
        }

        if (btnApplyModal && modal) {
            btnApplyModal.addEventListener('click', () => {
                const initArr = Puzzle.parseStateString(document.getElementById('customInitialInput').value);
                const goalArr = Puzzle.parseStateString(document.getElementById('customGoalInput').value);

                if (!initArr || !goalArr) {
                    alert('Please enter exactly 9 valid numbers (0-8 or _) for both boards.');
                    return;
                }

                window.visualizer.initialState = [...initArr];
                window.visualizer.goalState = [...goalArr];
                window.visualizer.currentState = [...initArr];
                window.visualizer.reset(true);
                window.visualizer.updateSolvabilityBadge();
                modal.classList.add('hidden');
            });
        }
    },

    validateModalInput() {
        const initText = document.getElementById('customInitialInput').value;
        const goalText = document.getElementById('customGoalInput').value;
        const statusEl = document.getElementById('modalValidationStatus');

        const initArr = Puzzle.parseStateString(initText);
        const goalArr = Puzzle.parseStateString(goalText);

        if (!initArr) {
            statusEl.innerHTML = '<span class="text-rose-400"><i class="fas fa-exclamation-triangle mr-1"></i> Initial state must contain digits 0-8 (or _) exactly once.</span>';
            return;
        }
        if (!goalArr) {
            statusEl.innerHTML = '<span class="text-rose-400"><i class="fas fa-exclamation-triangle mr-1"></i> Goal state must contain digits 0-8 (or _) exactly once.</span>';
            return;
        }

        const solv = Puzzle.checkSolvability(initArr, goalArr);
        if (solv.solvable) {
            statusEl.innerHTML = `<span class="text-emerald-400"><i class="fas fa-check-circle mr-1"></i> Valid configuration! (${solv.reason})</span>`;
        } else {
            statusEl.innerHTML = `<span class="text-amber-400"><i class="fas fa-info-circle mr-1"></i> ${solv.reason}</span>`;
        }
    },

    loadPreset(index) {
        if (index < 0 || index >= Puzzle.PRESETS.length || !window.visualizer) return;
        const p = Puzzle.PRESETS[index];
        window.visualizer.initialState = [...p.initial];
        window.visualizer.goalState = [...p.goal];
        window.visualizer.currentState = [...p.initial];
        window.visualizer.reset(true);
        window.visualizer.updateSolvabilityBadge();
    },

    // =========================================================================
    // PLAYBACK CONTROLS
    // =========================================================================

    bindPlaybackControls() {
        const btnRun = document.getElementById('btnRun');
        const btnPause = document.getElementById('btnPause');
        const btnResume = document.getElementById('btnResume');
        const btnNext = document.getElementById('btnNext');
        const btnPrev = document.getElementById('btnPrev');
        const btnReset = document.getElementById('btnReset');
        const speedSlider = document.getElementById('speedSlider');
        const stepScrubber = document.getElementById('stepScrubber');
        const btnReplaySolution = document.getElementById('btnReplaySolution');

        if (btnRun) btnRun.addEventListener('click', () => window.visualizer.startSolve());
        if (btnPause) btnPause.addEventListener('click', () => window.visualizer.pause());
        if (btnResume) btnResume.addEventListener('click', () => window.visualizer.resume());
        if (btnNext) btnNext.addEventListener('click', () => window.visualizer.stepForward());
        if (btnPrev) btnPrev.addEventListener('click', () => window.visualizer.stepBackward());
        if (btnReset) btnReset.addEventListener('click', () => window.visualizer.reset(true));

        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                window.visualizer.setSpeed(parseInt(e.target.value, 10));
            });
        }

        if (stepScrubber) {
            stepScrubber.addEventListener('input', (e) => {
                window.visualizer.jumpToStep(e.target.value);
            });
        }

        if (btnReplaySolution) {
            btnReplaySolution.addEventListener('click', () => {
                window.visualizer.playSolutionPath();
            });
        }

        const btnRunBenchmark = document.getElementById('btnRunBenchmark');
        if (btnRunBenchmark) {
            btnRunBenchmark.addEventListener('click', () => {
                if (window.visualizer) {
                    ComparisonModule.runBenchmark(window.visualizer.initialState, window.visualizer.goalState);
                }
            });
        }
    },

    // =========================================================================
    // AESTHETIC THEME SWITCHER (Cosmic / Candy / Emerald / Sunset)
    // =========================================================================

    bindThemeSwitcher() {
        const themes = [
            { id: 'theme-cosmic', name: 'Cosmic', icon: '🔮' },
            { id: 'theme-candy', name: 'Candy', icon: '🍬' },
            { id: 'theme-emerald', name: 'Emerald', icon: '🌿' },
            { id: 'theme-sunset', name: 'Sunset', icon: '🌅' }
        ];

        let currentThemeId = localStorage.getItem('app_theme') || 'theme-cosmic';
        this.applyTheme(currentThemeId);

        const btn = document.getElementById('btnThemeToggle');
        if (btn) {
            btn.addEventListener('click', () => {
                const curIdx = themes.findIndex(t => t.id === currentThemeId);
                const nextIdx = (curIdx + 1) % themes.length;
                currentThemeId = themes[nextIdx].id;
                this.applyTheme(currentThemeId);
                localStorage.setItem('app_theme', currentThemeId);
            });
        }
    },

    applyTheme(themeId) {
        const themes = [
            { id: 'theme-cosmic', name: 'Cosmic', icon: '🔮' },
            { id: 'theme-candy', name: 'Candy', icon: '🍬' },
            { id: 'theme-emerald', name: 'Emerald', icon: '🌿' },
            { id: 'theme-sunset', name: 'Sunset', icon: '🌅' }
        ];
        themes.forEach(t => document.body.classList.remove(t.id));
        document.body.classList.add(themeId);

        const current = themes.find(t => t.id === themeId) || themes[0];
        const iconEl = document.getElementById('currentThemeIcon');
        const nameEl = document.getElementById('currentThemeName');
        if (iconEl) iconEl.textContent = current.icon;
        if (nameEl) nameEl.textContent = current.name;
    },

    // =========================================================================
    // STUDENT DETAILS & CUSTOMIZATION (Tanu - 24BCB0061)
    // =========================================================================

    bindStudentDetails() {
        const defaultDetails = {
            course: "Artificial Intelligence (CS401)",
            title: "Interactive 8-Puzzle Problem Solver using AI Search Algorithms",
            name: "Tanu",
            reg: "24BCB0061"
        };

        let saved = JSON.parse(localStorage.getItem('student_details') || JSON.stringify(defaultDetails));
        
        // Auto-migrate old placeholder registration number to Tanu's actual Reg No
        if (!saved.reg || saved.reg.startsWith('REG') || saved.reg === 'REG12345678') {
            saved.reg = '24BCB0061';
            saved.name = 'Tanu';
            localStorage.setItem('student_details', JSON.stringify(saved));
        }

        this.updateStudentBanner(saved);

        const btnEditStudent = document.getElementById('btnEditStudent');
        const modalStudent = document.getElementById('studentModal');
        const btnSaveStudent = document.getElementById('btnSaveStudent');
        const btnCancelStudent = document.getElementById('btnCancelStudent');

        if (btnEditStudent && modalStudent) {
            btnEditStudent.addEventListener('click', () => {
                document.getElementById('inputCourse').value = saved.course;
                document.getElementById('inputTitle').value = saved.title;
                document.getElementById('inputStudentName').value = saved.name;
                document.getElementById('inputRegNo').value = saved.reg;
                modalStudent.classList.remove('hidden');
            });
        }

        if (btnCancelStudent && modalStudent) {
            btnCancelStudent.addEventListener('click', () => modalStudent.classList.add('hidden'));
        }

        if (btnSaveStudent && modalStudent) {
            btnSaveStudent.addEventListener('click', () => {
                const updated = {
                    course: document.getElementById('inputCourse').value || defaultDetails.course,
                    title: document.getElementById('inputTitle').value || defaultDetails.title,
                    name: document.getElementById('inputStudentName').value || defaultDetails.name,
                    reg: document.getElementById('inputRegNo').value || defaultDetails.reg
                };
                localStorage.setItem('student_details', JSON.stringify(updated));
                this.updateStudentBanner(updated);
                modalStudent.classList.add('hidden');
            });
        }
    },

    updateStudentBanner(details) {
        const els = {
            course: document.getElementById('displayCourseName'),
            title: document.getElementById('displayAssignmentTitle'),
            name: document.getElementById('displayStudentName'),
            reg: document.getElementById('displayRegNumber')
        };
        if (els.course) els.course.textContent = details.course;
        if (els.title) els.title.textContent = details.title;
        if (els.name) els.name.textContent = details.name;
        if (els.reg) els.reg.textContent = details.reg;
    },

    // =========================================================================
    // KEYBOARD SHORTCUTS
    // =========================================================================

    bindKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

            // In Game Mode: Arrow keys & WASD slide tiles!
            if (this.currentTab === 'game' && window.gameEngine) {
                if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                    e.preventDefault();
                    window.gameEngine.handleKeyMove('UP');
                } else if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                    e.preventDefault();
                    window.gameEngine.handleKeyMove('DOWN');
                } else if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    e.preventDefault();
                    window.gameEngine.handleKeyMove('LEFT');
                } else if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    e.preventDefault();
                    window.gameEngine.handleKeyMove('RIGHT');
                } else if (e.key === 'h' || e.key === 'H') {
                    window.gameEngine.giveHint();
                }
                return;
            }

            // In Visualizer Mode: Space, ArrowRight, ArrowLeft, R
            if (this.currentTab === 'visualizer' && window.visualizer) {
                if (e.code === 'Space') {
                    e.preventDefault();
                    if (window.visualizer.isRunning && !window.visualizer.isPaused) {
                        window.visualizer.pause();
                    } else if (window.visualizer.isRunning && window.visualizer.isPaused) {
                        window.visualizer.resume();
                    } else {
                        window.visualizer.startSolve();
                    }
                } else if (e.code === 'ArrowRight') {
                    e.preventDefault();
                    window.visualizer.stepForward();
                } else if (e.code === 'ArrowLeft') {
                    e.preventDefault();
                    window.visualizer.stepBackward();
                } else if (e.key === 'r' || e.key === 'R') {
                    window.visualizer.reset(true);
                }
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
