// Oscar Collins 2025
// SAE203 groupe A2
// AI usage: Written manually, AI help for transforming GET request system to POST.
//           comments written by AI. GPT4.1-mini

// BUTTON FOR SAVE PATH TO DB------------------------------------------------------

// Add a click event listener to the button with ID 'save-path-btn'.
document.getElementById('save-path-btn').addEventListener('click', () => {
    // Retrieve the selected start and destination data from the global selectedData object.
    const start = selectedData['start'];
    const destination = selectedData['destination'];

    // Validate that both start and destination have been selected.
    if (!start || !destination) {
        console.log('Please select both a start and destination location.');

        // Add a 'shake' CSS class to the button to provide visual feedback for the error.
        const button = document.getElementById('save-path-btn');
        button.classList.add('shake');

        // Remove the 'shake' class once the animation ends to allow future shakes.
        button.addEventListener('animationend', () => {
            button.classList.remove('shake');
        }, { once: true });  // Ensures the event listener is removed after firing once.

        // Exit early since required selections are missing.
        return;
    }

    // Fetch the journey path from the server by calling CreatePath.php with start and finish IDs.
    fetch(`../../SRC/CreatePath.php?start=${encodeURIComponent(start[0])}&finish=${encodeURIComponent(destination[0])}`)
        .then(response => response.json()) // Parse the response as JSON.
        .then(data => {
            // Extract the journey node IDs from the response and send them to savePathToDB.php via POST.
            return fetch('../../SRC/savePathToDB.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                // Encode the journey node IDs as a JSON string and send as 'pathData' parameter.
                body: `pathData=${encodeURIComponent(JSON.stringify(data.journey.map(item => item[0])))}`
            });
        })
        .then(res => res.text()) // Read the response text from the savePathToDB.php call.
        .then(result => {
            // Log success message; optionally, provide user feedback here.
            console.log('Path saved successfully!');
        })
        .catch(err => {
            // Log any errors encountered during the fetch calls.
            console.error('Error: ' + err.message);
            // Optionally, provide user feedback for the error here.
        });
});
//-----------------------------------------------------------------------------------