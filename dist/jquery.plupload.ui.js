/*
* pluploadUI - jQuery plugin for plupload ui widgets
*
* Version: 0.0.1
* Build: 26
* Copyright 2011 Alex Tkachev
*
* Dual licensed under MIT or GPLv2 licenses
*   http://en.wikipedia.org/wiki/MIT_License
*   http://en.wikipedia.org/wiki/GNU_General_Public_License
*
* Date: 13 Dec 2011 21:54:21
*/

(function($) {

  $.pluploadUI = { };

  $.fn.pluploadUI = function(options) {
    if (options == 'api') {
      return this.data('api');
    } else {
      if ($.type(options) === "object") {

        //find ui type class
        var typeKey = options.type || $.fn.pluploadUI.defaults.type;
        var uiTypeClass = $.fn.pluploadUI.types[typeKey];
        if (!$.isFunction(uiTypeClass)) throw 'unknown ui type ' + uiTypeClass;

        //init default options: override: global defaults  <--  ui type class defaults  <-- user configuration
        options = $.extend(true, {}, $.fn.pluploadUI.defaults, uiTypeClass.defaults, options);
        options.type = uiTypeClass;

        this.each(function() {
          var $this = $(this);

          //create separate configuration for this instance
          var config = $.extend(true, {
            rtl: $this.css('direction') == 'rtl',
            container: {id: plupload.guid()},
            browse: {id: plupload.guid()}
          }, options);

          config.uploader.container = config.container.id; //id of the container relative to which browse button overlay will be positioned (by plupload)
          config.uploader.browse_button = config.browse.id; //id of the browse button (over which overlay will be positioned)

          $this.data('api', new uiTypeClass($this, config));
        });
      }
      return this;
    }
  };

  $.fn.pluploadUI.types = {};

  //global defaults (will be overriden by type class defaults and then overriden by user config)
  $.fn.pluploadUI.defaults = {
    type: 'single',
    browse: {},
    uploader: {
      dragdrop: false,
      multi_selection: true,
      multipart: true,
      runtimes : 'gears,silverlight,flash,html5,browserplus',
      max_file_size : '5mb'
    }
  };


})(jQuery);
(function($) {

  $.pluploadUI.i18n = $.i18n();

  var errorCodesToI18nKey = {};
  errorCodesToI18nKey[plupload.INIT_ERROR] = 'errors.init';
  errorCodesToI18nKey[plupload.IO_ERROR] = 'errors.io';
  errorCodesToI18nKey[plupload.FILE_SIZE_ERROR] = 'errors.fileSize';
  errorCodesToI18nKey[plupload.FILE_EXTENSION_ERROR] = 'errors.fileExtension';

  $.pluploadUI.errorCodeToI18nKey = function(code){
    return errorCodesToI18nKey[code];
  };

})(jQuery);
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
            '<div id="' + options.browse.id + '" class="button">' + (options.browse.text || $.pluploadUI.i18n.t('single.buttons.browse')) + '</div>' +
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
      var self = this;
      jQuery('div.messages div.message', this.el).each(function(){
        var div = $(this);
        div.toggle(div.hasClass(type));
        if(newContents && div.hasClass(type)){
          div.html(newContents);
          self.uploader.refresh();
        }
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
(function($) {

  var delay = window.setTimeout;
  var delayPeriod = 20;

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
      if(options.rtl) {
        this.el.addClass('rtl');
        this.el.toggleClass('scrollbarLeft', $.rtlScrollbarPosition() == 'left');
      }
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
            '<div id="' + options.browse.id + '" class="button">' + $.pluploadUI.i18n.t('queue.buttons.browse') + '</div>' +
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
                '<div class="start">' +
                  '<a class="button start" href="javascript:;" style="display: none">'+$.pluploadUI.i18n.t('queue.buttons.start')+'</a>' +
                '</div>' +
                '<div class="uploading">' +
                  '<span class="status">'+$.pluploadUI.i18n.t('queue.messages.uploading')+'</span> ' +
                  '<a class="button stop" href="javascript:;">'+$.pluploadUI.i18n.t('queue.buttons.stop')+'</a>' +
                '</div>' +
                '<div class="complete">' +
                  '<span class="status">'+$.pluploadUI.i18n.t('queue.messages.success')+'</span> ' +
                  '<span class="uploaded"/> ' +
                  '<a class="button clear" href="javascript:;">'+$.pluploadUI.i18n.t('queue.buttons.clear')+'</a>' +
                '</div>'+
                '<div class="stopped">' +
                  '<span class="status">'+$.pluploadUI.i18n.t('queue.messages.stopped')+'</span> ' +
                  '<span class="uploaded"/>' +
                  '<a class="button resume" href="javascript:;">'+$.pluploadUI.i18n.t('queue.buttons.resume')+'</a>' +
                  '<a class="button clear" href="javascript:;">'+$.pluploadUI.i18n.t('queue.buttons.clear')+'</a>' +
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
        self.el.addClass('stopped');
      });
      $('a.button.resume, a.button.start', divQueue).click(function(e) {
        e.preventDefault();
        self.uploader.start();
      });
      $('a.button.clear', divQueue).click(function(e) {
        e.preventDefault();
        self._clearCompleted();
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
        delay(function(){ //the timeout needed because the file isn't yet added to files collection of the uploader on some runtimes, and it has no files to upload
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

          var start = false;
          for(var i=0; i<up.files.length; i++){
            if(up.files[i].status == plupload.QUEUED) {
              start = true;
              break;
            }
          }

          self._updateTotals();

          if(start) up.start();
        }, delayPeriod);
      });

      uploader.bind('Error', function(up, err){
        delay(function(){
          var message = null;
          if(err.code == plupload.INIT_ERROR){ //triggered when no runtime can be initialized
            self.el.addClass('noRuntimeAvailable');
            $('div.noruntime', self.el).html($.pluploadUI.errorCodeToI18nKey(err.code) ? $.pluploadUI.i18n.t($.pluploadUI.errorCodeToI18nKey(err.code)) : err.message);
          }
          else if(err.code == plupload.FILE_SIZE_ERROR){
            message = $.pluploadUI.i18n.t($.pluploadUI.errorCodeToI18nKey(err.code), {size: plupload.formatSize(err.file.size), max: plupload.formatSize(up.settings.max_file_size)});
          }
          if(message === null){
            message = $.pluploadUI.errorCodeToI18nKey(err.code) ? $.pluploadUI.i18n.t($.pluploadUI.errorCodeToI18nKey(err.code)) : err.message;
          }

          var file = err.file;
          if(file){
            file.status = plupload.FAILED;
            self._handleFileStatus(file, message);
          }
        }, delayPeriod);
      });

      uploader.bind('StateChanged', function() {
        delay(function(){
          if (uploader.state === plupload.STARTED) {
            self.el.addClass('uploading disabled');
            self.el.removeClass('uploadComplete stopped start');
          } else if (uploader.state === plupload.STOPPED){
            self.el.removeClass('uploading disabled');
          }
        }, delayPeriod);
      });

      uploader.bind('FileUploaded', function(up, file, response) {
        delay(function(){
          var evalResult = eval(response.response);
          var errorMessage = null;
          if(evalResult && evalResult.error === true){ //ERROR
            file.status = plupload.FAILED;
            errorMessage = evalResult.message;
          } else if(file.status == plupload.DONE){
            self._updateFileProgress(file);
          }
          self.debug('FileUploaded: ' + file.name + ', response:' + evalResult);

          self._handleFileStatus(file, errorMessage);

          self._updateTotals();
        }, delayPeriod);
      });

      uploader.bind('UploadComplete', function(up, file) {
        delay(function(){
          self.el.removeClass('uploading');
          self.el.addClass('uploadComplete');

          self._updateTotals();
        }, delayPeriod);
      });

      uploader.bind("UploadProgress", function(up, file) {
        delay(function(){
          self._updateFileProgress(file);
          self._handleFileStatus(file);
          self._updateTotals();
        }, delayPeriod);
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

    // Set file specific progress
    _updateFileProgress: function(file){
      var divFile = $('#'+file.id);
      $('div.progress', divFile).html(file.percent + '%');
    },

    _updateTotals: function() {
      $('div.footer div.progress', this.el).html(this.uploader.total.percent + '%');
      //var sizeToUpload = 0;
      //jQuery.each(uploader.files, function(i, file){ sizeToUpload += file.size });
      //$('div.footer div.size', target).html(plupload.formatSize(uploader.total.size) + ' / ' + plupload.formatSize(sizeToUpload));
      $('div.footer div.size', this.el).html(plupload.formatSize(this.uploader.total.size));
      $('div.footer div.name span.uploaded', this.el).html($.pluploadUI.i18n.t('queue.footer.uploaded', {uploaded: this.uploader.total.uploaded, total: this.uploader.files.length}));
    },

    _clearCompleted: function(){
      var self = this;
      var filesToRemove = [];
      $.each(this.uploader.files, function(i, file){
        if(file.status == plupload.DONE || file.status == plupload.FAILED){
          filesToRemove.push(file);
        }
      });
      $.each(filesToRemove, function(i, file){
        var divFile = $('#'+file.id);
        self.uploader.removeFile(file);
        divFile.remove();
      });
      //remove files that aren't in uploader (files that had error on add)
      $('div.files div.file.failed', this.el).remove();

      this.el.removeClass('uploadComplete stopped');
      this._showStart();
      this._updateTotals();
    },

    _showStart: function(){
      this.el.addClass('start');
      var queued = false;
      $.each(this.uploader.files, function(i, file){
        if(file.status == plupload.QUEUED){
          queued = true;
        }
      });
      $('a.button.start', this.el).toggle(queued);
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
