$.pluploadUI.i18n.register('en-US', {
  browseButton: {
    text: 'Choose file'
  },
  errors: {
    io: 'Server error occured. Please try again later',
    init: 'No runtime could be initialized',
    fileSize: 'File size of %{size} exceeds maximum of %{max}',
    fileExtension: 'File extension is not allowed'
  },
  single: {
    messages: {
      intro: 'Click on button to upload file',
      uploading: 'Uploading files...',
      success: 'File successfully uploaded!'
    }
  },
  queue: {
    header: {
      name: 'File name',
      size: 'Size',
      status: 'Status'
    },
    messages: {
      uploading: 'Uploading files...',
      success: 'Upload complete.',
      stopped: 'Upload stopped.'
    },
    footer: {
      uploaded: 'Uploaded %{uploaded}/%{total} files',
      stop: 'Stop',
      clear: 'Clear completed',
      resume: 'Resume',
      start: 'Start'
    }
  }
});
