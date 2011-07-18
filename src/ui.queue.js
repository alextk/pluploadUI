(function($) {

  var statusesCssHash = {};
  $.each(['done', 'failed', 'queued', 'uploading'], function(i, item){
    statusesCssHash[plupload[item.toUpperCase()]] = item;
  });

  var QueueUIClass = function() {
    this.initialize.apply(this, arguments);
  };

  $.extend(QueueUIClass.prototype, {

    initialize: function(target, options) {
      this.options = options;
      this.el = this._createUI(target, options);
      this.filesErrorsOnAdd = {};

      this.uploader = new plupload.Uploader(options.uploader);
      this._initUploadListeners();
      this.uploader.init();
    },

    _createUI: function(target, options) {
      var divQueue = $(
        '<div class="pluploadUI queue">' +
          '<div class="noruntime"/>' +
          '<div id="' + options.container.id + '" class="choose">' +
            '<div id="' + options.browse.id + '" class="button">' + $.pluploadUI.i18n.t('browseButton.text') + '</div>' +
            '<div class="info"/>' +
            '<div class="clear"/>' +
          '</div>' +
          '<div class="filesList">' +
            '<div class="header">' +
              '<div class="name">' + $.pluploadUI.i18n.t('queue.header.name') + '</div>' +
              '<div class="progress">' + $.pluploadUI.i18n.t('queue.header.status') + '</div>' +
              '<div class="size">' + $.pluploadUI.i18n.t('queue.header.size') + '</div>' +
              '<div class="clear"/>' +
            '</div>' +

            '<div class="files"/>' +
            '<div class="footer">' +
              '<div class="name">' +
                '<div class="uploading">' +
                  '<span class="status">'+$.pluploadUI.i18n.t('queue.messages.uploading')+'</span> ' +
                  '<a class="button stop" href="javascript:;">'+$.pluploadUI.i18n.t('queue.footer.stop')+'</a>' +
                '</div>' +
                '<div class="complete">' +
                  '<span class="status">'+$.pluploadUI.i18n.t('queue.messages.success')+'</span> ' +
                  '<span class="uploaded"/>' +
                  '<a class="button clear" href="javascript:;">'+$.pluploadUI.i18n.t('queue.footer.clear')+'</a>' +
                '</div>'+
              '</div>'+
              '<div class="progress">0%</div>' +
              '<div class="size">0 KB</div>' +
              '<div class="clear"/>' +
            '</div>' +
          '</div>' +
          '<div class="debug">'+
            '<h5>debugging:</h5>' +
          '</div>' +
        '</div>'
      );

      if (options.browse.cls) $('div.choose div.button', divQueue).addClass(options.browse.cls);
      if (options.container.cls) divQueue.addClass(options.container.cls);

      //render info
      $('div.info', divQueue).append($('div.info', target).children());

      //bind stop upload listener
      var self = this;
      $('a.button.stop', divQueue).click(function(e) {
        e.preventDefault();
        self.uploader.stop();
      });
      $('a.button.clear', divQueue).click(function(e) {
        e.preventDefault();
      });

      return divQueue.appendTo(target);
    },

    _initUploadListeners: function(){
      var uploader = this.uploader;
      var self = this;

      uploader.bind('Init', function(up, params) {
        self.debug("Current runtime: " + params.runtime);
      });

      uploader.bind("FilesAdded", function(up, files){
        $.each(files, function(i, file) {
          $('div.filesList div.files', self.el).append(
                  $('<div class="file"/>').attr('id', file.id).append(
                          $('<div class="name"/>').html(file.name),
                          $('<div class="progress"/>').html('0%'),
                          $('<div class="size"/>').html(plupload.formatSize(file.size)),
                          $('<div class="clear"/>'),
                          $('<div class="error"/>')
                  )
          );
          if(self.filesErrorsOnAdd[file.id]){
            self._handleFileStatus(file, self.filesErrorsOnAdd[file.id].message);
          }
        });

        up.refresh(); // Reposition Flash/Silverlight

        setTimeout(function(){ //the timeout needed because the file isn't yet added to files collection of the uploader on some runtimes, and it has no files to upload
          var start = false;
          for(var i=0; i<up.files.length; i++){
            if(up.files[i].status == plupload.QUEUED) {
              start = true;
              break;
            }
          }

          self._updateTotals();
          
          if(start) up.start();
        }, 300);
      });

      uploader.bind('Error', function(up, err){
        var message = null;
        if(err.code == plupload.INIT_ERROR){ //triggered when no runtime can be initialized
          self.el.addClass('noRuntimeAvailable');
          $('div.noruntime', self.el).html($.pluploadUI.errorCodeToI18nKey(err.code) ? $.pluploadUI.i18n.t($.pluploadUI.errorCodeToI18nKey(err.code)) : err.message);
        }
        else if(err.code == plupload.FILE_SIZE_ERROR){
          message = $.pluploadUI.i18n.t($.pluploadUI.errorCodeToI18nKey(err.code), {size: plupload.formatSize(err.file.size), max: plupload.formatSize(up.settings.max_file_size)});
        }
        if(message == null){
          message = $.pluploadUI.errorCodeToI18nKey(err.code) ? $.pluploadUI.i18n.t($.pluploadUI.errorCodeToI18nKey(err.code)) : err.message;
        }

        var file = err.file;
        if(file){
          file.status = plupload.FAILED;
          self._handleFileStatus(file, message);
        }
      });

      uploader.bind('StateChanged', function() {
        if (uploader.state === plupload.STARTED) {
          self.el.addClass('uploading disabled');
          self.el.removeClass('uploadComplete');
        } else if (uploader.state === plupload.STOPPED){
          self.el.removeClass('uploading disabled');
        }
      });

      uploader.bind('FileUploaded', function(up, file, response) {
        var evalResult = eval(response.response);
        var errorMessage = null;
        if(evalResult && evalResult.error === true){ //ERROR
          file.status = plupload.FAILED;
          errorMessage = evalResult.message;
        }
        self.debug('FileUploaded: ' + file.name + ', response:' + evalResult);

        self._handleFileStatus('error', errorMessage);

        self._updateTotals();
      });

      uploader.bind('UploadComplete', function(up, file) {
        self.el.removeClass('uploading');
        self.el.addClass('uploadComplete');

        self._updateTotals();
      });

      uploader.bind("UploadProgress", function(up, file) {
        var divFile = $('#'+file.id);
        // Set file specific progress
        $('div.progress', divFile).html(file.percent + '%');

        self._handleFileStatus(file);

        self._updateTotals();
      });
    },

    _handleFileStatus: function(file, errorMessage){
        var divFile = $('#'+file.id);
        if(divFile.length > 0){
          var actionClass = statusesCssHash[file.status];
          divFile.attr('class', 'file '+actionClass);
          if(errorMessage) $('div.error', divFile).html(errorMessage);
        } else { //before files added - save error message for later
          this.filesErrorsOnAdd[file.id] = {file: file, message: errorMessage};
        }
    },

    _updateTotals: function() {
      $('div.footer div.progress', this.el).html(this.uploader.total.percent + '%');
      //var sizeToUpload = 0;
      //jQuery.each(uploader.files, function(i, file){ sizeToUpload += file.size });
      //$('div.footer div.size', target).html(plupload.formatSize(uploader.total.size) + ' / ' + plupload.formatSize(sizeToUpload));
      $('div.footer div.size', this.el).html(plupload.formatSize(this.uploader.total.size));
      $('div.footer div.name span.uploaded', this.el).html($.pluploadUI.i18n.t('queue.footer.uploaded', {uploaded: this.uploader.total.uploaded, total: this.uploader.files.length}));
    },

    debug: function(message){
      $('div.debug', this.el).append($('<div></div>').html(message));
    }

  });

  $.fn.pluploadUI.types.queue = QueueUIClass;
  $.fn.pluploadUI.types.queue.defaults = {
    uploader: {
      multi_selection: true
    }
  };

})(jQuery);