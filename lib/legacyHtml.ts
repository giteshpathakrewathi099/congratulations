export const CREATE_PAGE_HTML = `
<div class="split-layout-wrapper">
    <div class="sidebar-overlay" onclick="toggleMobileSidebar()"></div>
    <!-- LEFT SIDE: FORM -->
    <div class="form-sidebar" data-aos="fade-right" data-aos-duration="1500">
        <div class="form-header">
            <h2>Create Your Card</h2>
            <div class="theme-switcher-group" id="themeSwitcher">
                <button class="theme-switch-btn" data-theme="light" aria-label="Light theme">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                </button>
                <button class="theme-switch-btn" data-theme="system" aria-label="System theme">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="4" y="4" width="16" height="12" rx="2" />
                        <line x1="2" y1="20" x2="22" y2="20" />
                    </svg>
                </button>
                <button class="theme-switch-btn" data-theme="dark" aria-label="Dark theme">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- TABS -->
        <div class="tabs-container">
            <button class="tab-scroll-btn left-scroll" onclick="scrollTabs(-1)" aria-label="Scroll left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div class="card-type-tabs" id="cardTabsContainer">
                <button class="tab-btn active" data-tab="1" onclick="selectCardType(1)" title="Text Card">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <span>Text</span>
                </button>
                <button class="tab-btn" data-tab="2" onclick="selectCardType(2)" title="Image Card">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    <span>Image</span>
                </button>
                <button class="tab-btn" data-tab="3" onclick="selectCardType(3)" title="Image Music Story">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                    <span>Image+Music</span>
                </button>
                <button class="tab-btn" data-tab="4" onclick="selectCardType(4)" title="Video Original Audio">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
                    <span>Video</span>
                </button>
                <button class="tab-btn" data-tab="5" onclick="selectCardType(5)" title="Video with Music">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    <span>Video+Music</span>
                </button>
                <button class="tab-btn" data-tab="6" onclick="selectCardType(6)" title="Video without Text Messages">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                    <span>No Text</span>
                </button>
            </div>
            <button class="tab-scroll-btn right-scroll" onclick="scrollTabs(1)" aria-label="Scroll right">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
        </div>

        <div class="gen-container form-scroll-area">
            <div class="input-group" id="nameGroup">
                <label>Recipient Name</label>
                <input type="text" id="nameInput" placeholder="e.g. Gitesh" oninput="updateLivePreview()">
            </div>

            <div class="input-group" id="typeGroup">
                <label>Message Type</label>
                <select id="typeInput" onchange="updateLivePreview()">
                    <option value="Congratulations">Congratulations</option>
                    <option value="Happy Birthday">Happy Birthday</option>
                    <option value="Birthday Soon">Birthday Soon</option>
                    <option value="Best Wishes">Best Wishes</option>
                    <option value="Thank You">Thank You</option>
                    <option value="Happy Wedding Anniversary">Happy Wedding Anniversary</option>
                </select>
            </div>

            <div class="input-group" id="imageGroup" style="display: none;">
                <label>Image (URL or Upload)</label>
                <div class="combined-input">
                    <input type="text" id="imgInput" placeholder="Paste URL or click upload" oninput="onImageInputChange(); updateLivePreview();">
                    <label for="fileInput" class="upload-icon-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <input type="file" id="fileInput" accept="image/*" style="display: none;" onchange="onImageFileSelected(this)">
                    </label>
                </div>
                <small id="fileNameDisplay" style="display: none; margin-top: 8px; color: var(--primary-gold); font-weight: 600;"></small>
            </div>

            <div class="input-group" id="videoGroup" style="display: none;">
                <label>Video Upload</label>
                <div class="combined-input">
                    <input type="text" id="videoFileName" placeholder="Click to upload video" readonly
                        style="cursor: pointer;" onclick="document.getElementById('videoInput').click()">
                    <label for="videoInput" class="upload-icon-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M23 7l-7 5 7 5V7z" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                        <input type="file" id="videoInput" accept="video/*" style="display: none;" onchange="onVideoFileSelected(this)">
                    </label>
                </div>
                <small id="videoNameDisplay" style="display: none; margin-top: 8px; color: var(--primary-gold); font-weight: 600;"></small>
            </div>

            <div class="input-group" id="videoEditGroup" style="display: none;">
                <label>Video Edit (Optional)</label>
                <div class="video-duration-slider-row">
                    <input type="range" id="videoDurationSlider" min="1" max="60" value="15"
                        oninput="onVideoDurationSliderChange(this.value)">
                    <span class="video-duration-display" id="videoDurationDisplay">--</span>
                </div>
                <small class="video-edit-hint">Slide to shorten clip length from full video</small>
                <input type="hidden" id="videoStartInput" value="0">
                <input type="hidden" id="videoEndInput" value="">
            </div>

            <div class="input-group" id="descGroup">
                <label>Custom Description (Optional)</label>
                <textarea id="descInput" rows="3" placeholder="Write a heartfelt message..." oninput="updateLivePreview()"></textarea>
            </div>

            <div class="input-group" id="defaultMusicGroup" style="display: none;">
                <label>Default Music</label>
                <select id="defaultMusicInput" onchange="onDefaultMusicChange()">
                    <option value="none">No Default Music</option>
                    <option value="birthday">Birthday Music</option>
                    <option value="wedding">Wedding Music</option>
                    <option value="congrats">Congrats Music</option>
                    <option value="thankyou">Thank You Music</option>
                    <option value="wishes">Best Wishes Music</option>
                    <option value="romantic">Romantic Music</option>
                </select>
            </div>

            <div class="input-group" id="bgMusicGroup" style="display: none;">
                <label>Background Music</label>
                <button type="button" id="musicInputBtn"
                    style="background: var(--input-bg); color: var(--text-main); border: 1px solid var(--glass-border); text-align: left; padding: 0.9rem 1.1rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; width: 100%; cursor: pointer;"
                    onclick="openMusicSearchModal()">
                    <span id="musicInputDisplay">No Music</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </button>
                <input type="hidden" id="musicInput" value="none">
                <input type="hidden" id="musicCustomUrl" value="">
                <input type="hidden" id="musicStartTime" value="0">
                <input type="hidden" id="musicDuration" value="15">
            </div>

            <div class="input-group" id="themeGroup">
                <label>Default Theme</label>
                <select id="themeInput" onchange="applyPreviewCardTheme(); updateLivePreview();">
                    <option value="dark">Dark Theme</option>
                    <option value="light">Light Theme</option>
                </select>
            </div>

            <button class="action-btn" onclick="generateLink()">Generate Card</button>
        </div>
    </div>

    <!-- RIGHT SIDE: LIVE PREVIEW -->
    <div class="preview-side" data-aos="fade-left" data-aos-duration="1500">
        <div class="preview-header">Live Preview</div>
        <div class="controls-container" style="position: absolute; top: 24px; right: 30px; padding: 0;">
            <div class="music-group" id="musicControlGroup" style="display: none;">
                <button class="control-btn music-toggle-btn" onclick="toggleVolumeFlyout()" id="mainMusicBtn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                </button>

                <div class="volume-flyout" id="volumeFlyout">
                    <div class="flyout-header">Speakers</div>
                    <div class="current-track-label" id="currentTrackLabel"></div>
                    <div class="flyout-controls">
                        <button class="mute-btn" onclick="toggleMute()">
                            <svg id="flyoutSpeakerOn" width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                            </svg>
                            <svg id="flyoutSpeakerMute" width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2" style="display: none;">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <line x1="23" y1="9" x2="17" y2="15" />
                                <line x1="17" y1="9" x2="23" y2="15" />
                            </svg>
                        </button>
                        <div class="slider-wrapper" style=" align-items: center; display: flex;">
                            <input type="range" id="volumeSlider" style="padding: 2px;" min="0" max="100" value="50"
                                oninput="updateVolume(this.value)">
                        </div>
                        <div class="volume-percentage" id="volumeLevel">50</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="preview-wrapper">
            <div class="celebration-container" id="livePreviewCard">
                <video id="previewBgVideo" class="card-bg-video" playsinline loop muted style="display: none;"></video>
                <div class="user-image-container" id="previewImgContainer">
                    <img src="" alt="User Image" id="previewImg">
                </div>
                <h1 id="previewHeading">Congratulations</h1>
                <span class="recipient-name" id="previewUserName">Gitesh</span>
                <p class="celebration-text" id="previewDesc">Write a heartfelt message...</p>
            </div>
        </div>
    </div>

    <audio id="bgMusic" loop></audio>

    <!-- Mobile Menu Toggle Button -->
    <button class="mobile-menu-btn" onclick="toggleMobileSidebar()" aria-label="Toggle Form">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
    </button>
</div>

<!-- Modals -->
<div id="musicSearchModal" class="music-modal-overlay" onclick="if(event.target === this) closeMusicSearchModal()">
    <div class="music-modal">
        <div class="music-modal-header">
            <h3>Search Music</h3>
            <button class="close-modal-btn" onclick="closeMusicSearchModal()">✕</button>
        </div>
        <div class="music-search-bar">
            <input type="text" id="musicSearchInput" placeholder="Search for songs, artists..."
                onkeypress="if(event.key === 'Enter') searchItunesMusic()">
            <button class="search-music-btn" onclick="searchItunesMusic()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            </button>
        </div>
        <div class="music-results-container" id="musicResultsContainer">
            <div style="text-align: center; color: var(--text-dim); padding: 2rem;">Search for a song to add to your card</div>
        </div>
    </div>
</div>

<div id="musicTrimModal" class="music-modal-overlay" onclick="if(event.target === this) closeMusicTrimModal()">
    <div class="music-modal music-trim-modal">
        <div class="music-modal-header">
            <h3>Trim Music</h3>
            <button class="close-modal-btn" onclick="closeMusicTrimModal()">✕</button>
        </div>
        <div class="trim-info">
            <img id="trimAlbumArt" src="" alt="Album Art">
            <div class="trim-info-text">
                <h4 id="trimSongTitle">Song Title</h4>
                <p id="trimArtistName">Artist</p>
            </div>
        </div>
        <div class="smallarea">
            <div class="instagram-trimmer-wrapper">
                <div class="duration-slider-wrapper" style="margin-top: 1.5rem;">
                    <div class="instagram-trimmer-header" style="margin-bottom: 8px;">
                        <span>Playback Duration</span>
                        <span id="trimDurationDisplay" class="trim-time-badge">15s</span>
                    </div>
                    <input type="range" id="trimDurationSlider" class="instagram-duration-slider" min="1" max="60" value="15" step="1">
                </div>
                <div class="instagram-trimmer-header">
                    <span class="trim-label">Select song start point</span>
                    <span id="trimStartTimeDisplay" class="trim-time-badge">0:00</span>
                </div>
                <div class="instagram-trimmer-container">
                    <div class="duration-circle-container">
                        <div class="duration-circle-visual">
                            <span id="durationCircleText">15</span>
                        </div>
                    </div>
                    <div class="waveform-slider-container">
                        <input type="range" id="trimStartSlider" class="instagram-slider" min="0" max="30" value="0" step="1">
                    </div>
                </div>
            </div>
            <div class="trim-preview-controls">
                <button class="play-preview-btn" id="trimPlayBtn" onclick="toggleTrimPreview()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg> Preview
                </button>
            </div>
            <button class="action-btn" style="margin-top: 1.5rem;" onclick="saveMusicSelection()">Confirm Selection</button>
        </div>
    </div>
</div>
`;

export const CARD_PAGE_HTML = `<div class="controls-container">
        <div class="theme-switcher-group" id="themeSwitcher">
            <button class="theme-switch-btn" data-theme="light" aria-label="Light theme">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
            </button>
            <button class="theme-switch-btn" data-theme="system" aria-label="System theme">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="4" y="4" width="16" height="12" rx="2" />
                    <line x1="2" y1="20" x2="22" y2="20" />
                </svg>
            </button>
            <button class="theme-switch-btn" data-theme="dark" aria-label="Dark theme">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            </button>
        </div>

        <div class="color-theme-group" id="colorThemeGroup">
            <button class="control-btn color-toggle-btn" onclick="toggleColorThemeFlyout()" id="colorThemeBtn"
                aria-label="Open theme color controls">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2">
                    <path d="M12 3v18" />
                    <path d="M3 12h18" />
                    <path d="M12 3a9 9 0 0 1 9 9" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            </button>

            <div class="color-theme-flyout" id="colorThemeFlyout">
                <div class="flyout-header">Customize Theme</div>
                <div class="color-picker-grid">
                    <label class="color-picker-row">
                        <span>Text Color</span>
                        <input type="color" id="textColorInput" value="#ffffff" oninput="previewColorTheme()">
                    </label>
                    <label class="color-picker-row">
                        <span>Card Color</span>
                        <input type="color" id="cardColorInput" value="#111111" oninput="previewColorTheme()">
                    </label>
                    <label class="color-picker-row">
                        <span>Page Color</span>
                        <input type="color" id="pageColorInput" value="#050505" oninput="previewColorTheme()">
                    </label>
                </div>
                <button class="save-theme-btn" id="saveThemeBtn" onclick="saveCardTheme()">Save Theme</button>
                <p class="color-theme-status" id="colorThemeStatus"></p>
            </div>
        </div>

        <div class="music-group" id="musicControlGroup" style="display: none;">
            <button class="control-btn music-toggle-btn" onclick="toggleVolumeFlyout()" id="mainMusicBtn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
            </button>

            <div class="volume-flyout" id="volumeFlyout">
                <div class="flyout-header">Speakers</div>
                <div class="current-track-label" id="currentTrackLabel"></div>
                <div class="flyout-controls">
                    <button class="mute-btn" onclick="toggleMute()">
                        <svg id="flyoutSpeakerOn" width="18" height="18" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        </svg>
                        <svg id="flyoutSpeakerMute" width="18" height="18" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" style="display: none;">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <line x1="23" y1="9" x2="17" y2="15" />
                            <line x1="17" y1="9" x2="23" y2="15" />
                        </svg>
                    </button>
                    <div class="slider-wrapper" style=" align-items: center; display: flex;">
                        <input type="range" id="volumeSlider" style="padding: 2px;" min="0" max="100" value="50"
                            oninput="updateVolume(this.value)">
                    </div>
                    <div class="volume-percentage" id="volumeLevel">50</div>
                </div>
            </div>
        </div>

        <div class="download-group" id="downloadGroup">
            <button class="control-btn download-btn" onclick="downloadCard()" id="downloadCardBtn" aria-label="Download Card">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
            </button>
        </div>
    </div>

    <audio id="bgMusic" loop></audio>

    <canvas id="confettiCanvas" class="confetti-canvas" aria-hidden="true"></canvas>
    <main class="celebration-wrapper" data-aos="fade-down" data-aos-duration="2000">
        <div class="celebration-container" id="cardToDownload">
            <video id="cardBgVideo" class="card-bg-video" playsinline loop style="display: none;"></video>

            <div class="user-image-container" id="userImgContainer">
                <img src="" alt="User Image" id="userImg" crossorigin="anonymous">
            </div>

            <h1 id="cardHeading">Congratulations</h1>
            <span class="recipient-name" id="userName"> Our Valued Member</span>

            <p class="celebration-text" id="cardDesc">A remarkable achievement. Your journey has been nothing short of
                inspiring. Thank you for your unwavering commitment and excellence.</p>
        </div>
    </main>`;
