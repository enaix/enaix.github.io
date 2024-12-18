document.addEventListener('DOMContentLoaded', function () {
    //const previewImage = document.querySelector('.preview-image');
    const overlay = document.getElementById('overlay');
    const images = document.getElementsByTagName('main')[0].getElementsByTagName('img');
  
    for (let i = 0; i < images.length; i++)
    {
        if (images[i].classList.contains("matrix-icon")||images[i].classList.contains("star-icon")) continue;
        images[i].classList.add('img-hover');
        images[i].addEventListener('click', () => {
            overlay.classList.add('active');
            images[i].classList.add('active-img');
          });
        
          overlay.addEventListener('click', () => {
            overlay.classList.remove('active');
            images[i].classList.remove('active-img');
          });
    }
    
  });