async function userlogin() {
    //  alert("register");
    let validate = validateAjaxForm({
            // initialize the plugin
            rules: {
                email: {
                    required: true,
                    email: true,
                    message: "Please Enter Email ",
                },
                password: {
                    required: true,
                    message: "Please Enter Password",
                },
            },
        },
        "loginform"
    );
    if (validate) return;
    var formFields = {};
    var registerFields = $("#loginform").serializeArray();
    registerFields.map((mp) => {
        formFields[mp.name] = mp.value;
    });
    let data = await ajaxRequest({
        url: "/api/login/user",
        method: "POST",
        body: formFields,
    });
    if (data.success) {
        console.log('DDDDDD')
        if (data.redirectTo !== undefined) {
            location.href = data.redirectTo;
        } else {
            location.href =
                "/dashboard?hvrif=" + encodeURIComponent(hvrif) + "&plat=xero";
        }
    } else {
         console.log("DDDDDDOOOOOOOOOOOOOOOOOOOOOOOOO",data);
        if (data.redirectTo !== undefined) {
            location.href = data.redirectTo;
        } else {
            Swal.fire( data.error);
        }
    }
}

window.addEventListener("load", function() {
    // if (document.readyState === "complete") {
    //   let user = Cookies.get("user");
    //   if (user !== undefined) {
    //     location.href = "/dashboard";
    //   } else {
    //     let restrictUrls = ["/", "login", "register", "dashboard"];
    //     if (!restrictUrls.includes(location.pathname)) {
    //       location.href = "/";
    //     }
    //   }
    // }
});