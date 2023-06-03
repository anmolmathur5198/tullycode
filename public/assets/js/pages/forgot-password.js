async function forgotPassword() {
    //alert("register");
    let validate = validateAjaxForm({
            // initialize the plugin
            rules: {
                email: {
                    required: true,
                    email: true,
                    message: "Please provide valid Email Id",
                },
            },
        },
        "forgot-password-form"
    );
    if (validate) return;
    var formFields = {};
    var registerFields = $("#forgot-password-form").serializeArray();
    registerFields.map((mp) => {
        formFields[mp.name] = mp.value;
    });
    let data = await ajaxRequest({
        url: "/api/user/forgot-password",
        method: "POST",
        body: formFields,
    });
    if (data.success) {
        Swal.fire("Sucess", data.data, "success").then(() => {
            location.href = "/login";
        });
        // location.href = "/dashboard";
    } else {
        Swal.fire("User", data.error, "error");
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