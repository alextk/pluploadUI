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
