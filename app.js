// Markdown Reader PWA Application
class MarkdownReader {
    constructor() {
        this.fileInput = document.getElementById('fileInput');
        this.openBtn = document.getElementById('openBtn');
        this.closeBtn = document.getElementById('closeBtn');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        this.recentFilesList = document.getElementById('recentFilesList');
        this.welcomeMessage = document.getElementById('welcomeMessage');
        this.content = document.getElementById('content');
        this.fileName = document.getElementById('fileName');
        this.markdownContent = document.getElementById('markdownContent');
        this.recentFiles = document.getElementById('recentFiles');
        
        this.recentFilesData = this.loadRecentFiles();
        this.currentFileHandle = null;
        
        this.init();
    }

    init() {
        // Event listeners
        this.openBtn.addEventListener('click', () => this.openFile());
        this.closeBtn.addEventListener('click', () => this.closeFile());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Register service worker
        this.registerServiceWorker();
        
        // Display recent files
        this.displayRecentFiles();
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('sw.js');
                console.log('Service Worker registered successfully');
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    openFile() {
        this.fileInput.click();
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            this.displayMarkdown(text, file.name);
            this.saveToRecentFiles(file.name, text);
            
            // Reset file input so the same file can be selected again
            this.fileInput.value = '';
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Error reading file. Please try again.');
        }
    }

    displayMarkdown(text, filename) {
        // Hide welcome message and recent files, show content
        this.welcomeMessage.style.display = 'none';
        this.recentFiles.style.display = 'none';
        this.content.style.display = 'block';
        
        // Set filename
        this.fileName.textContent = filename;
        
        // Parse and render markdown
        let html;
        if (typeof marked !== 'undefined') {
            // Configure marked.js to sanitize HTML (security)
            if (marked.setOptions) {
                marked.setOptions({ 
                    sanitize: false, // Modern versions use DOMPurify or similar, deprecated option
                    breaks: true,
                    gfm: true
                });
            }
            // Try modern API first (v4+), fall back to legacy API
            // Note: marked.js v9+ has built-in XSS protection
            html = marked.parse ? marked.parse(text) : marked(text);
        } else {
            // Fallback: use simple markdown parsing (with HTML escaping)
            html = this.simpleMarkdownParse(text);
        }
        this.markdownContent.innerHTML = html;
        
        // Scroll to top
        window.scrollTo(0, 0);
    }

    simpleMarkdownParse(text) {
        // Simple markdown parser fallback
        let html = text;
        
        // Escape HTML
        html = html.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;');
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Code
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Links
        html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
        
        // Line breaks
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        
        return '<p>' + html + '</p>';
    }

    closeFile() {
        // Hide content, show welcome and recent files
        this.content.style.display = 'none';
        this.welcomeMessage.style.display = 'block';
        this.recentFiles.style.display = 'block';
        
        // Clear content
        this.markdownContent.innerHTML = '';
        this.fileName.textContent = '';
        this.currentFileHandle = null;
    }

    loadRecentFiles() {
        try {
            const stored = localStorage.getItem('recentFiles');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading recent files:', error);
            return [];
        }
    }

    saveToRecentFiles(filename, content) {
        // Remove duplicate if exists and clean up its content
        const existingIndex = this.recentFilesData.findIndex(f => f.name === filename);
        if (existingIndex !== -1) {
            const oldContentIndex = this.recentFilesData[existingIndex].contentIndex;
            if (oldContentIndex !== undefined) {
                localStorage.removeItem(`mdreader_content_${oldContentIndex}`);
            }
            this.recentFilesData = this.recentFilesData.filter(f => f.name !== filename);
        }
        
        // Generate a unique content index based on timestamp
        const contentIndex = Date.now();
        
        // Save content separately with its own key
        try {
            localStorage.setItem(`mdreader_content_${contentIndex}`, content);
        } catch (error) {
            console.error('Error saving file content:', error);
            // If storage quota exceeded, try to clean up old content
            if (error.name === 'QuotaExceededError') {
                this.cleanupOldContent(5);
                try {
                    localStorage.setItem(`mdreader_content_${contentIndex}`, content);
                } catch (e) {
                    console.error('Still cannot save content after cleanup:', e);
                    alert('Storage quota exceeded. Please clear some recent files.');
                    return;
                }
            } else {
                return;
            }
        }
        
        // Add to beginning of array with content index reference
        this.recentFilesData.unshift({
            name: filename,
            contentIndex: contentIndex,
            timestamp: Date.now()
        });
        
        // Keep only last 10 files
        const removedFiles = this.recentFilesData.splice(10);
        // Clean up content for removed files
        removedFiles.forEach(file => {
            if (file.contentIndex !== undefined) {
                localStorage.removeItem(`mdreader_content_${file.contentIndex}`);
            }
        });
        
        // Save metadata to localStorage
        try {
            localStorage.setItem('recentFiles', JSON.stringify(this.recentFilesData));
            this.displayRecentFiles();
        } catch (error) {
            console.error('Error saving recent files metadata:', error);
        }
    }

    cleanupOldContent(keepCount) {
        // Keep only the most recent N files and remove older content
        if (this.recentFilesData.length > keepCount) {
            const toRemove = this.recentFilesData.splice(keepCount);
            toRemove.forEach(file => {
                if (file.contentIndex !== undefined) {
                    localStorage.removeItem(`mdreader_content_${file.contentIndex}`);
                }
            });
            localStorage.setItem('recentFiles', JSON.stringify(this.recentFilesData));
        }
    }

    loadFileContent(contentIndex) {
        try {
            return localStorage.getItem(`mdreader_content_${contentIndex}`);
        } catch (error) {
            console.error('Error loading file content:', error);
            return null;
        }
    }

    displayRecentFiles() {
        if (this.recentFilesData.length === 0) {
            this.recentFiles.style.display = 'none';
            return;
        }
        
        this.recentFiles.style.display = 'block';
        this.recentFilesList.innerHTML = '';
        
        this.recentFilesData.forEach((file, index) => {
            const li = document.createElement('li');
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            
            const fileName = document.createElement('span');
            fileName.className = 'file-name';
            fileName.textContent = file.name;
            
            const fileDate = document.createElement('span');
            fileDate.className = 'file-date';
            fileDate.textContent = this.formatDate(file.timestamp);
            
            fileInfo.appendChild(fileName);
            fileInfo.appendChild(fileDate);
            
            // Create button container
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'file-buttons';
            
            // Add Update button
            const updateBtn = document.createElement('button');
            updateBtn.className = 'update-file';
            updateBtn.textContent = '🔄 Update';
            updateBtn.title = 'Reload latest version';
            updateBtn.onclick = (e) => {
                e.stopPropagation();
                this.updateRecentFile(index, file.name);
            };
            
            // Add Remove button
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-file';
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                this.removeRecentFile(index);
            };
            
            buttonContainer.appendChild(updateBtn);
            buttonContainer.appendChild(removeBtn);
            
            li.appendChild(fileInfo);
            li.appendChild(buttonContainer);
            
            // Click on file to load cached content
            li.onclick = () => {
                // Load content from separate localStorage entry
                if (file.contentIndex !== undefined) {
                    const content = this.loadFileContent(file.contentIndex);
                    if (content) {
                        this.displayMarkdown(content, file.name);
                    } else {
                        alert(`Content not found for "${file.name}".\n\nPlease use "Update" button to reload the file.`);
                    }
                } else {
                    alert(`No content index for "${file.name}".\n\nPlease use "Update" button to reload the file.`);
                }
            };
            
            this.recentFilesList.appendChild(li);
        });
    }

    updateRecentFile(index, filename) {
        // Trigger file picker to update this specific file
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.markdown,.txt';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file && file.name === filename) {
                try {
                    const text = await file.text();
                    this.displayMarkdown(text, file.name);
                    this.saveToRecentFiles(file.name, text);
                } catch (error) {
                    console.error('Error updating file:', error);
                    alert('Error updating file. Please try again.');
                }
            } else if (file) {
                alert(`Please select the same file: ${filename}`);
            }
        };
        input.click();
    }

    removeRecentFile(index) {
        const file = this.recentFilesData[index];
        // Remove content from localStorage
        if (file && file.contentIndex !== undefined) {
            localStorage.removeItem(`mdreader_content_${file.contentIndex}`);
        }
        // Remove from array
        this.recentFilesData.splice(index, 1);
        localStorage.setItem('recentFiles', JSON.stringify(this.recentFilesData));
        this.displayRecentFiles();
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all recent files?')) {
            // Remove all content entries
            this.recentFilesData.forEach(file => {
                if (file.contentIndex !== undefined) {
                    localStorage.removeItem(`mdreader_content_${file.contentIndex}`);
                }
            });
            // Clear metadata
            this.recentFilesData = [];
            localStorage.removeItem('recentFiles');
            this.displayRecentFiles();
        }
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new MarkdownReader());
} else {
    new MarkdownReader();
}
