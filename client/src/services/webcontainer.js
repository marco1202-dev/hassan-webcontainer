import { WebContainer } from '@webcontainer/api';

class WebContainerService {
  constructor() {
    this.webcontainer = null;
    this.isBooting = false;
    this.isReady = false;
  }

  async initialize() {
    if (this.webcontainer || this.isBooting) {
      return this.webcontainer;
    }

    this.isBooting = true;
    
    try {
      console.log('Booting WebContainer...');
      this.webcontainer = await WebContainer.boot();
      this.isReady = true;
      console.log('WebContainer ready!');
      return this.webcontainer;
    } catch (error) {
      console.error('Failed to boot WebContainer:', error);
      throw error;
    } finally {
      this.isBooting = false;
    }
  }

  async mountProject(files) {
    if (!this.webcontainer) {
      await this.initialize();
    }

    try {
      // Convert file structure to WebContainer format
      const fileTree = this.convertToFileTree(files);
      
      console.log('Mounting files:', fileTree);
      await this.webcontainer.mount(fileTree);
      
      return true;
    } catch (error) {
      console.error('Failed to mount project:', error);
      throw error;
    }
  }

  convertToFileTree(files) {
    const tree = {};
    
    files.forEach(file => {
      const pathParts = file.relativePath.split('/');
      let current = tree;
      
      // Navigate through the path, creating directories as needed
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part]) {
          current[part] = {
            directory: {}
          };
        }
        current = current[part].directory;
      }
      
      // Add the file
      const fileName = pathParts[pathParts.length - 1];
      current[fileName] = {
        file: {
          contents: file.content || ''
        }
      };
    });
    
    return tree;
  }

  async installDependencies() {
    if (!this.webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    try {
      console.log('Installing dependencies...');
      const installProcess = await this.webcontainer.spawn('npm', ['install']);
      
      return new Promise((resolve, reject) => {
        installProcess.output.pipeTo(new WritableStream({
          write(data) {
            console.log(data);
          }
        }));

        installProcess.exit.then((code) => {
          if (code === 0) {
            console.log('Dependencies installed successfully');
            resolve();
          } else {
            reject(new Error(`npm install failed with code ${code}`));
          }
        });
      });
    } catch (error) {
      console.error('Failed to install dependencies:', error);
      throw error;
    }
  }

  async startDevServer(command = 'npm start') {
    if (!this.webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    try {
      console.log(`Starting dev server with: ${command}`);
      const [cmd, ...args] = command.split(' ');
      const serverProcess = await this.webcontainer.spawn(cmd, args);
      
      // Listen for server ready
      serverProcess.output.pipeTo(new WritableStream({
        write(data) {
          console.log(data);
        }
      }));

      return serverProcess;
    } catch (error) {
      console.error('Failed to start dev server:', error);
      throw error;
    }
  }

  async executeCommand(command) {
    if (!this.webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    try {
      console.log(`Executing: ${command}`);
      const [cmd, ...args] = command.split(' ');
      const process = await this.webcontainer.spawn(cmd, args);
      
      let output = '';
      
      process.output.pipeTo(new WritableStream({
        write(data) {
          output += data;
          console.log(data);
        }
      }));

      const exitCode = await process.exit;
      
      return {
        exitCode,
        output,
        success: exitCode === 0
      };
    } catch (error) {
      console.error('Failed to execute command:', error);
      throw error;
    }
  }

  async getPreviewUrl() {
    if (!this.webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    try {
      // WebContainer automatically serves on port 3000
      this.webcontainer.on('server-ready', (port, url) => {
        console.log(`Server ready at ${url}`);
        return url;
      });
      
      // For now, return the default preview URL
      return 'http://localhost:3000';
    } catch (error) {
      console.error('Failed to get preview URL:', error);
      throw error;
    }
  }

  async writeFile(path, content) {
    if (!this.webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    try {
      await this.webcontainer.fs.writeFile(path, content);
      return true;
    } catch (error) {
      console.error('Failed to write file:', error);
      throw error;
    }
  }

  async readFile(path) {
    if (!this.webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    try {
      const content = await this.webcontainer.fs.readFile(path, 'utf-8');
      return content;
    } catch (error) {
      console.error('Failed to read file:', error);
      throw error;
    }
  }

  getWebContainer() {
    return this.webcontainer;
  }

  isInitialized() {
    return this.isReady;
  }
}

// Export singleton instance
export const webContainerService = new WebContainerService();
export default webContainerService;

