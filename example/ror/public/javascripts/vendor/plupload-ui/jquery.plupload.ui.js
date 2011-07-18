/*
* pluploadUI - jQuery plugin for rendering dialog
*
* Version: 0.0.1a
* Copyright 2011 Alex Tkachev
*
* Dual licensed under MIT or GPLv2 licenses
*   http://en.wikipedia.org/wiki/MIT_License
*   http://en.wikipedia.org/wiki/GNU_General_Public_License
*
* Date: Sun Jul 17 10:43:19 2011 +0300
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
    browse: {text: 'Choose file'},
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
  }

})(jQuery);
(function($) {

  var SingleFileUIClass = function() {
    this.initialize.apply(this, arguments);
  };

  $.extend(SingleFileUIClass.prototype, {

    initialize: function(target, options) {
      this.options = options;
      this.el = this._createUI(target, options);

      this.uploader = new plupload.Uploader(options.uploader);
      this._initUploadListeners();
      this.uploader.init();
    },

    _createUI: function(target, options) {
      var divUploader = $(
        '<div id="' + options.container.id + '" class="pluploadUI singleFile">' +
          '<div class="messages">' +
            '<div class="message intro">' + $.pluploadUI.i18n.t('messages.intro') + '</div>' +
            '<div class="message uploading">' +
              '<span class="icon">' + $.pluploadUI.i18n.t('messages.uploading') + '</span>' +
              '<span class="percent"/>' +
            '</div>' +
            '<div class="message error"/>' +
            '<div class="message success">' + $.pluploadUI.i18n.t('messages.success') + '</div>' +
          '</div>' +
          '<div class="choose">' +
            '<div id="' + options.browse.id + '" class="button">' + $.pluploadUI.i18n.t('browseButton.text') + '</div>' +
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
          self.el.addClass('disabled');
        }
        else if(err.code == plupload.FILE_SIZE_ERROR){
          message = $.pluploadUI.i18n.t($.pluploadUI.errorCodeToI18nKey(err.code), {size: plupload.formatSize(err.file.size), max: plupload.formatSize(up.settings.max_file_size)});
        }
        if(message == null){
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
    }
  };

})(jQuery);