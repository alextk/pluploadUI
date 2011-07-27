(function($) {

  var SingleFileUIClass = function() {
    this.initialize.apply(this, arguments);
  };

  $.extend(SingleFileUIClass.prototype, {

    initialize: function(target, options) {
      this.options = options;
      this.el = this._createUI(target, options);
      if(options.rtl) this.el.addClass('rtl');

      this.uploader = new plupload.Uploader(options.uploader);
      this._initUploadListeners();
      this.uploader.init();
    },

    _createUI: function(target, options) {
      var divUploader = $(
        '<div id="' + options.container.id + '" class="pluploadUI singleFile">' +
          '<div class="messages">' +
            '<div class="message intro">' + (options.messages.intro || $.pluploadUI.i18n.t('single.messages.intro')) + '</div>' +
            '<div class="message uploading">' +
              '<span class="icon">' + (options.messages.uploading || $.pluploadUI.i18n.t('single.messages.uploading')) + '</span>' +
              '<span class="percent"/>' +
            '</div>' +
            '<div class="message error"/>' +
            '<div class="message success">' + (options.messages.success || $.pluploadUI.i18n.t('single.messages.success')) + '</div>' +
          '</div>' +
          '<div class="choose">' +
            '<div id="' + options.browse.id + '" class="button">' + (options.browse.text || $.pluploadUI.i18n.t('browseButton.text')) + '</div>' +
            '<div class="info"/>' +
            '<div class="clear"/>' +
          '</div>' +
          '<div class="debug">'+
            '<h5>debugging:</h5>' +
          '</div>' +
        '</div>'
      );

      if (options.browse.cls) $('div.choose div.button', divUploader).addClass(options.browse.cls);
      if (options.container.cls) divUploader.addClass(options.container.cls);

      $('div.messages div.message', divUploader).not('.intro').hide();

      //render info
      $('div.info', divUploader).append($('div.info', target).children());

      return divUploader.appendTo(target);
    },

    _initUploadListeners: function(){
      var uploader = this.uploader;
      var self = this;

      uploader.bind('Init', function(up, params) {
        self.debug("Current runtime: " + params.runtime);
        self._showMessage('intro');
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

      uploader.bind('StateChanged', function() {
        if (uploader.state === plupload.STARTED) {
          self._showMessage('uploading');
          self.el.addClass('disabled');
        } else if (uploader.state === plupload.STOPPED){
          self.el.removeClass('disabled');
        }
      });

      uploader.bind('FileUploaded', function(up, file, response) {
        var evalResult = eval(response.response);
        if(evalResult && evalResult.error === true){ //ERROR
          file.status = plupload.FAILED;
          self._showMessage('error', evalResult.message);
        }
        self.debug('FileUploaded: ' + file.name + ', response:' + evalResult);

        if(file.status == plupload.DONE){ //SUCCESS: upload completed ok
          self._showMessage('success');
        }
      });

      uploader.bind('UploadComplete', function(up, file) {
        self.el.removeClass('working');
      });

      uploader.bind("UploadProgress", function(up, file) {
        jQuery('div.messages div.message.uploading span.percent', self.el).html(file.percent + "%");
      });
    },

    _showMessage: function(type, newContents){
      jQuery('div.messages div.message', this.el).each(function(){
        var div = $(this);
        div.toggle(div.hasClass(type));
        if(newContents && div.hasClass(type)) div.html(newContents);
      });
    },

    debug: function(message){
      $('div.debug', this.el).append($('<div></div>').html(message));
    }

  });

  $.fn.pluploadUI.types.single = SingleFileUIClass;
  $.fn.pluploadUI.types.single.defaults = {
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