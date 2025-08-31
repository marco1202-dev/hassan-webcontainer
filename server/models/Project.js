const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  framework: {
    type: String,
    required: [true, 'Framework is required'],
    enum: ['react', 'nextjs', 'vue', 'svelte', 'angular', 'vanilla', 'other'],
    default: 'vanilla'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  files: [{
    filename: {
      type: String,
      required: true
    },
    filepath: {
      type: String,
      required: true
    },
    relativePath: {
      type: String,
      required: true
    },
    filetype: {
      type: String,
      required: true,
      default: 'unknown'
    },
    size: {
      type: Number,
      required: true
    },
    isDirectory: {
      type: Boolean,
      default: false
    }
  }],
  mainFile: {
    type: String,
    default: 'index.html'
  },
  projectStructure: {
    type: Map,
    of: [String],
    default: {}
  },
  stats: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    forks: { type: Number, default: 0 }
  },
  settings: {
    autoPreview: { type: Boolean, default: true },
    hotReload: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Index for better query performance
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ isPublic: 1, createdAt: -1 });
projectSchema.index({ framework: 1, isPublic: 1 });

// Virtual for project URL
projectSchema.virtual('url').get(function() {
  return `/projects/${this._id}`;
});

// Method to increment view count
projectSchema.methods.incrementView = function() {
  this.stats.views += 1;
  return this.save();
};

// Method to get public project data (without sensitive info)
projectSchema.methods.getPublicData = function() {
  const projectObject = this.toObject();
  delete projectObject.owner;
  return projectObject;
};

// Method to build project structure from files
projectSchema.methods.buildProjectStructure = function() {
  const structure = new Map();
  
  this.files.forEach(file => {
    const pathParts = file.relativePath.split('/');
    let currentPath = '';
    
    pathParts.forEach((part, index) => {
      if (index === pathParts.length - 1) {
        // This is a file
        if (!structure.has(currentPath)) {
          structure.set(currentPath, []);
        }
        structure.get(currentPath).push(file.filename);
      } else {
        // This is a directory
        if (currentPath === '') {
          currentPath = part;
        } else {
          currentPath = currentPath + '/' + part;
        }
        
        if (!structure.has(currentPath)) {
          structure.set(currentPath, []);
        }
      }
    });
  });
  
  this.projectStructure = structure;
  // Don't save here to avoid parallel save issues
  return this;
};

// Pre-save middleware removed to avoid parallel save issues
// Project structure will be built manually in upload routes

module.exports = mongoose.model('Project', projectSchema);
