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
