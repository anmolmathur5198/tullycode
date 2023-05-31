
async function register() {
  // alert("register");
  let validate = validateAjaxForm(
    {
      // initialize the plugin
      rules: {
        firstname: {
          required: true,
          message: "Please Enter Firstname",
        },
        lastname: {
          required: true,
          message: "Please Enter Firstname",
        },
        email: {
          required: true,
          email: true,
          message: "Please Enter Email ",
        },
        password: {
          required: true,
          message: "Please Enter Password",
        },
        confirmpassword: {
          required: true,
          message: "Please Enter Password",
          matched: "Password and confirm password do not match",
        },
      },


    },

    "registerform"
  );

  if (validate) return;

let validate2=false

  var formFields = {};
  var registerFields = $("#registerform").serializeArray();
  registerFields.map((mp) => {
    formFields[mp.name] = mp.value;

  });
  if (formFields.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formFields.email)) {
      // email is not valid
      Swal.fire("Email is invalid");
      validate2=true


    }
  }
  if (formFields.firstname) {
    const firstname = formFields.firstname.trim();
    if (firstname.length < 3 || firstname.length > 8) {
      Swal.fire("First name should be between 3 and 8 characters");
      validate2=true
    } else if (/\d/.test(firstname)) {
      Swal.fire("Error", "First name should not contain numbers");
      validate2=true
    }
  }
  if (lastname.length < 3 || lastname.length > 8) {
    Swal.fire("First name should be between 3 and 8 characters");
    validate2=true
  } else if (/\d/.test(lastname)) {
    Swal.fire("Error", "Last name should not contain numbers");
    validate2=true
  }
  if (formFields.password) {
    const password = formFields.password.trim();
    if (password.length < 3 || password.length > 12) {
      Swal.fire("Password should be between 3 and 12 characters");
      validate2=true
    }
  }

 if(!validate2){
  let response = await ajaxRequest({
    url: "/api/register/user",
    method: "POST",
    body: formFields,
  });
  if (response.success) {
    if (response.redirectTo !== undefined) {
      location.href = response.redirectTo;
    }
  } else {
    Swal.fire(response.error);
  }
 }
}
