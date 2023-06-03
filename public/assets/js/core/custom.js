//Header Shrink JS//
function init() {
	window.addEventListener('scroll', function(e) {
		var distanceY = window.pageYOffset || document.documentElement.scrollTop;
			shrinkOn = 5;			
			if (distanceY > shrinkOn) {
				$('header').addClass('shrink');
				//$('body').addClass('scroll-fn');
			} else {
				$('header').removeClass('shrink');
				//$('body').removeClass('scroll-fn');
		}

	});
}
window.onload = init();


//popular_slider  JS//
var owl = $('.popular_slider');
  owl.owlCarousel({
	loop:true,
 navText: ["<img src='images/arrow-left.png'>","<img src='images/arrow.png'>"],
    margin:0,
	dots:false,
	items:1,
  nav:true,
	autoplay:true,
	autoplayTimeout:5000,
	autoplayHoverPause:false,
   
})

  //popular_slider  JS//
var owl = $('.recent_slider');
  owl.owlCarousel({ margin:30,
    navText: ["<img src='images/arrow-left.png'>","<img src='images/arrow.png'>"],
  dots:false,
  items:3,
  nav:true,
  autoplay:false,
  autoplayTimeout:5000,
  autoplayHoverPause:false,
  responsive : {
 
    0 : {
      items:1,       
    },
    576 : {
       items:2, 
    },
    992 : {
       items:3,
    }
}
   
})
//search bar toggle
$(".advance-filter").click(function(){
  $(".advance-filter-el").slideToggle();
});

//Back to Top Scroll JS//
$(document).ready(function(){
     $(window).scroll(function () {
            if ($(this).scrollTop() > 200) {
                $('#back-to-top').fadeIn();
            } else {
                $('#back-to-top').fadeOut();
            }
        });
        // scroll body to 0px on click
        $('#back-to-top').click(function () {
            $('#back-to-top').tooltip('hide');
            $('body,html').animate({
                scrollTop: 0
            }, 800);
            return false;
        });
});
//sider bar navigation//
$(".mob_side_bars").click(function(){  
  $(".side_nav").slideToggle();
   $(".menu_title").toggleClass("open");
});


/*dropdown*/
  $(".drop-label").click(function(){
  $(this).toggleClass("open");
});

  // Property detail slider

//   jQuery(document).ready(function() {
//   $('#gallery-2').royalSlider({
//     fullscreen: {
//       enabled: true,
//       nativeFS: true
//     },
//     controlNavigation: 'thumbnails',
//     thumbs: {
//       orientation: 'vertical',
//       paddingBottom: 4,
//       appendSpan: true
//     },
//     transitionType:'fade',
//     autoScaleSlider: true, 
//     //autoScaleSliderWidth: 960,     
//    // autoScaleSliderHeight: 600,
//     loop: true,
//     arrowsNav: false,
//     keyboardNavEnabled: true

//   });
// });

  /*sidebar menu dashboard*/
    $(".menuImage2").click(function(){
  $(this).toggleClass("menuopen");
  $(".dash-asidebar").toggleClass("sidebar-open");

});


$(document).ready(function() {
    $(document).on('click', '.js-open-sidethread', function() {
		if($('.mySidebar').hasClass('toggle-thread')){
			$('.mySidebar').removeClass('toggle-thread')
		}else{
			$('.mySidebar').addClass('toggle-thread')
		}		
    })	
})

// //Fancy Scollbar

//     (function($){
//         $(window).on("load",function(){
//             $(".content").mCustomScrollbar();
//         });
//     })(jQuery);


$(document).ready(function(){
  $('[data-toggle="tooltip"]').tooltip();   
});




