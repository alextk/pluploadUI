(function($) {

  $.rtlScrollbarPosition = (function() {
    var position = null;

    return function(){
      if(position === null){
        var parent = $('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo('body');
        var child = parent.children();
        var offset1 = child.offset();
        var offset2 = child.height(99).offset();
        parent.remove();
        position = offset2.left > offset1.left ? 'left' : 'right';
      }
      return position;
    };
  })();

})(jQuery);