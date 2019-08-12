$( document ).ready(function() {
	
	/* SIDEBAR NAV */
	$(".mdl-layout-title,main.section").hide();
	$(".mdl-layout-title#dashboard,main#dashboard").show();
	$(".mdl-navigation__link").bind("click", function() {
		//$(".mdl-navigation__link.active").removeClass("active");
		//$(this).addClass("active");
		//sectionname = $(this).attr("id");	
		//$(".mdl-layout-title,main.section").hide();
		//$(".mdl-layout-title#"+sectionname+",main#"+sectionname).show();
		
	});

});

