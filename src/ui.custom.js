(function($) {

  var CustomFileUIClass = function() {
    this.initialize.apply(this, arguments);
  };

  $.extend(CustomFileUIClass.prototype, {

    initialize: function(el, options) {
      this.el = el;
      this.options = options;
      this._initUI(options);

      this.uploader = new plupload.Uploader(options.uploader);
      this._initUploadListeners();
      this.uploader.init();
    },

    _initUI: function(options) {
      if(options.rtl) this.el.addClass('rtl');
      this.el.attr('id', options.container.id).addClass('pluploadUI singleFileCustomUI');
      var chooser = this.el.find('[data-uirole=chooser]');
      if(chooser.length != 1) throw new Error('Custom ui upload must have exactly one element with attribue: [data-uirole=chooser]');
      chooser.attr('id', options.browse.id);
    },

    _initUploadListeners: function(){
      var uploader = this.uploader;
      var self = this;

      uploader.bind('Init', function(up, params) {
        self.debugMessage("Current runtime: " + params.runtime);
        self._showMessage('idle');
      });

      uploader.bind("FilesAdded", function(up, files){
        up.refresh(); // Reposition Flash/Silverlight

        setTimeout(function(){ //the timeout needed because the file isn't yet added to files collection of the uploader on some runtimes, and it has no files to upload
          var start = false;
          for(var i=0; i<up.files.length; i++){
            if(up.files[i].status == plupload.QUEUED) {
              start = true;
              break;
            }
          }
          if(start) up.start();
        }, 300);
      });

      uploader.bind('Error', function(up, err){
        var message = null;
        if(err.code == plupload.INIT_ERROR){ //triggered when no runtime can be initialized
          self.el.addClass('noRuntimeAvailable');
        }
        else if(err.code == plupload.FILE_SIZE_ERROR){
          message = $.pluploadUI.i18n.t($.pluploadUI.errorCodeToI18nKey(err.code), {size: plupload.formatSize(err.file.size), max: plupload.formatSize(up.settings.max_file_size)});
        }
        if(message === null){
          message = $.pluploadUI.errorCodeToI18nKey(err.code) ? $.pluploadUI.i18n.t($.pluploadUI.errorCodeToI18nKey(err.code)) : err.message;
        }
        self._showMessage('error', message);
      });

      uploader.bind('StateChanged', function(up) {
        self.debugMessage('StateChanged: ' + uploader.state);
        if (uploader.state === plupload.STARTED) {
          self._showMessage('uploading');
          up.trigger("DisableBrowse", true);
          self.el.addClass('disabled');
        } else if (uploader.state === plupload.STOPPED){
          self.el.removeClass('disabled');
        }
      });

      uploader.bind('FileUploaded', function(up, file, response) {
        self.debugMessage('FileUploaded: ' + file.name + ', response:' + response);
        var evalResult = eval(response.response);
        self.debugMessage('FileUploaded: ' + file.name + ', evalResult:' + evalResult);
        if(evalResult && evalResult.error === true){ //ERROR
          file.status = plupload.FAILED;
          self._showMessage('error', evalResult.message);
        }

        if(file.status == plupload.DONE){ //SUCCESS: upload completed ok
          self._showMessage('success');
        }
      });

      uploader.bind('UploadComplete', function(up, file) {
        self.el.removeClass('working');
        up.trigger("DisableBrowse", false);
      });

      uploader.bind("UploadProgress", function(up, file) {
        self.debugMessage('UploadProgress: ' + file.name + ', file.percent:' + file.percent);

        var msgEl = self.el.find('[data-uirole=uploading_message]');
        msgEl.find('[data-uirole=percent_placeholder]').html(file.percent + "%");
      });
    },

    _showMessage: function(type, newContents){
      var self = this;
      var uirole = type + '_message';
      this.el.find('[data-uirole=idle_message], [data-uirole=success_message], [data-uirole=error_message], [data-uirole=uploading_message]').hide();
      var msgEl = this.el.find('[data-uirole='+uirole+']').show();
      if(newContents){
        msgEl.find('[data-uirole=placeholder]').html(newContents);
      }
    },

    debugMessage: function(message){
      if(this.options.debugEnabled) this.el.find('[data-uirole=debug_message]').append($('<div></div>').html(message));
    },

    onUploadSuccess: function(callback){
      this._showMessage('success');
      if(callback instanceof Function) callback.call(this);
    },

    onUploadError: function(message){
      this._showMessage('error', message);
    }

  });

  $.fn.pluploadUI.types.custom = CustomFileUIClass;
  $.fn.pluploadUI.types.custom.defaults = {
    uploader: {
      multi_selection: false
    },
    messages: {
      intro: null,
      uploading: null,
      success: null
    }
  };

})(jQuery);