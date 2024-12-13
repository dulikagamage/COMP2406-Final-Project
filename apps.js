function loadActivity() {
    const typeFilter = document.getElementById('typeFilter').value;
    const participantsFilter = document.getElementById('participantsFilter').value;

    // Check if the user is authenticated
    fetch('/check-auth')
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                const url = `/filter-activities?type=${typeFilter}&participants=${participantsFilter}`;

                fetch(url)
                    .then(response => response.json())
                    .then(data => updateContent(data))
                    .catch(error => console.error('Error fetching activities:', error));
            } else {
                alert('Please log in or sign up to generate activities.');
            }
        })
        .catch(error => console.error('Error checking authentication status:', error));
}

function updateContent(data) {
    const contentContainer = document.getElementById('contentContainer');
    // Clear previous content
    contentContainer.innerHTML = '';

    // Implement logic to update content based on the fetched data
    if (Array.isArray(data)) {
        if (data.length > 0) {
            data.forEach(activity => {
                appendActivityToContainer(activity, contentContainer);
            });
        } else {
            contentContainer.innerHTML = 'No activities found matching your filters.';
        }
    } else if (typeof data === 'object' && data.activity) {
        appendActivityToContainer(data, contentContainer);
    } else {
        contentContainer.innerHTML = 'No activities found matching your filters.';
    }
}

function appendActivityToContainer(activity, container) {
    const activityElement = document.createElement('div');
    activityElement.innerHTML = `<strong>${activity.activity || 'Unknown Activity'}</strong><br>`;
    activityElement.innerHTML += `Type: ${activity.type || 'Unknown Type'}<br>`;
    activityElement.innerHTML += `Participants: ${activity.participants || 'Unknown Participants'}<br>`;
    activityElement.innerHTML += `Accessibility: ${activity.accessibility || 'Unknown Accessibility'}<br><br>`;
    container.appendChild(activityElement);
}

// function toggleForms() {
//     const loginForm = document.getElementById('loginForm');
//     const signupForm = document.getElementById('signupForm');
//     const loginBtn = document.getElementById('loginBtn');
//     const signupBtn = document.getElementById('signupBtn');
//     const toggleFormBtn = document.getElementById('toggleFormBtn');

//     // Toggle visibility of login and signup forms
//     loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
//     signupForm.style.display = signupForm.style.display === 'none' ? 'block' : 'none';

//     // Toggle button text based on the active form
//     if (loginForm.style.display === 'block') {
//         toggleFormBtn.textContent = 'Switch to Sign Up';
//     } else {
//         toggleFormBtn.textContent = 'Switch to Login';
//     }

//     // Toggle the type attribute of the submit buttons
//     loginBtn.type = loginBtn.type === 'submit' ? 'button' : 'submit';
//     signupBtn.type = signupBtn.type === 'submit' ? 'button' : 'submit';
// }

function fetchUserList() {
    // Check if the user is authenticated and is an admin
    fetch('/check-auth')
        .then(response => response.json())
        .then(data => {
            if (data.role === 'admin') {
                // Fetch the list of all users and handle accordingly
                fetch('/admin/users')
                    .then(response => response.json())
                    .then(users => {
                        // Display the list of users (modify as needed)
                        console.log('List of Users:', users);
                    })
                    .catch(error => console.error('Error fetching user list:', error));
            } else {
                alert('You do not have permission to fetch the user list.');
            }
        })
        .catch(error => console.error('Error checking authentication status:', error));
}