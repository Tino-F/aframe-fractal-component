window.onload = function () {
  var canvas = document.querySelector( '.a-canvas' );

  canvas.addEventListener('dragover', function( e ) {
    e.preventDefault();
  })

  canvas.addEventListener('drop', function( e ) {

    console.log('File(s) dropped');

    // Prevent default behavior (Prevent file from being opened)
    e.preventDefault();

    if ( e.dataTransfer.items ) {

      if ( e.dataTransfer.items[0].kind === 'file' ) {
        var file = e.dataTransfer.items[0].getAsFile();
        var blobURL = window.URL.createObjectURL( file );
        document.getElementById('audio').setAttribute('src', blobURL);
        document.querySelector('.songtitle').innerHTML = file.name;
      }

    }

  });

}
