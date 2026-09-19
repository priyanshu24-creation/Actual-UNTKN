document.addEventListener("DOMContentLoaded", () => {

    const loginButton = document.getElementById("loginButton");
    const uploadButton = document.getElementById("uploadButton");

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    const loginStatus = document.getElementById("loginStatus");
    const loginResult = document.getElementById("loginResult");

    const productIdInput = document.getElementById("productId");
    const imageInput = document.getElementById("image");

    const resultElement = document.getElementById("result");
    const preview = document.getElementById("preview");


    // LOGIN

    loginButton.addEventListener("click", async () => {

        console.log("LOGIN BUTTON CLICKED");

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            loginStatus.textContent =
                "Please enter email and password.";
            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";

        try {

            const response = await fetch("/api/auth/login", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                body: JSON.stringify({
                    email,
                    password
                })
            });

            const result = await response.json();

            console.log("LOGIN RESPONSE:", result);

            loginResult.style.display = "block";

            loginResult.textContent =
                JSON.stringify(result, null, 2);

            if (response.ok && result.success) {

                loginStatus.textContent =
                    "Login successful. You can now upload an image.";

                uploadButton.disabled = false;

            } else {

                loginStatus.textContent =
                    result.message || "Login failed.";

                uploadButton.disabled = true;
            }

        } catch (error) {

            console.error("LOGIN ERROR:", error);

            loginStatus.textContent =
                "Login request failed.";

            loginResult.style.display = "block";

            loginResult.textContent =
                error.message;

        } finally {

            loginButton.disabled = false;
            loginButton.textContent = "Login";
        }
    });


    // IMAGE PREVIEW

    imageInput.addEventListener("change", () => {

        const file = imageInput.files[0];

        if (!file) {
            preview.style.display = "none";
            preview.src = "";
            return;
        }

        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
    });


    // UPLOAD

    uploadButton.addEventListener("click", async () => {

        console.log("UPLOAD BUTTON CLICKED");

        const productId =
            productIdInput.value.trim();

        const file =
            imageInput.files[0];

        if (!productId) {

            resultElement.style.display = "block";

            resultElement.textContent =
                "Please enter Product ID.";

            return;
        }

        if (!file) {

            resultElement.style.display = "block";

            resultElement.textContent =
                "Please select an image.";

            return;
        }

        const formData = new FormData();

        formData.append("image", file);

        uploadButton.disabled = true;
        uploadButton.textContent = "Uploading...";

        resultElement.style.display = "block";
        resultElement.textContent = "Uploading image...";

        try {

            const response = await fetch(
                `/api/products/${productId}/images`,
                {
                    method: "POST",
                    body: formData,
                    credentials: "include"
                }
            );

            const result = await response.json();

            console.log("UPLOAD RESPONSE:", result);

            resultElement.textContent =
                JSON.stringify(result, null, 2);

        } catch (error) {

            console.error("UPLOAD ERROR:", error);

            resultElement.textContent =
                "Upload failed:\n\n" +
                error.message;

        } finally {

            uploadButton.disabled = false;
            uploadButton.textContent = "Upload Image";
        }
    });

});