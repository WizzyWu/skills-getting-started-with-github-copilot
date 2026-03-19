document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset activity select
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list with a participants section
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activity = name;
        activityCard.dataset.max = details.max_participants;

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants</h5>
            <ul class="participants-list"></ul>
          </div>
        `;

        // populate participants list (with delete icon)
        const ul = activityCard.querySelector(".participants-list");
        if (details.participants && details.participants.length) {
          details.participants.forEach((email) => {
            const li = document.createElement("li");
            li.className = "participant";
            li.innerHTML = `
              <span class="participant-email">${email}</span>
              <button class="remove-participant" aria-label="Remove participant">✖</button>
            `;

            const btn = li.querySelector(".remove-participant");
            btn.addEventListener("click", async (e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );

                const result = await resp.json();
                if (resp.ok) {
                  // remove list item
                  li.remove();
                  // update availability text
                  const avail = activityCard.querySelector('.availability');
                  const currentParticipants = activityCard.querySelectorAll('.participants-list .participant').length;
                  const newSpots = details.max_participants - currentParticipants;
                  avail.innerHTML = `<strong>Availability:</strong> ${newSpots} spots left`;

                  // if no participants left, show placeholder
                  if (currentParticipants === 0) {
                    const emptyLi = document.createElement('li');
                    emptyLi.textContent = 'No participants yet';
                    emptyLi.className = 'participant empty';
                    ul.appendChild(emptyLi);
                  }

                  messageDiv.textContent = result.message || 'Unregistered participant';
                  messageDiv.className = 'success';
                  messageDiv.classList.remove('hidden');
                  setTimeout(() => messageDiv.classList.add('hidden'), 4000);
                } else {
                  messageDiv.textContent = result.detail || 'Failed to unregister';
                  messageDiv.className = 'error';
                  messageDiv.classList.remove('hidden');
                }
              } catch (err) {
                console.error('Error unregistering:', err);
                messageDiv.textContent = 'Failed to unregister. Please try again.';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }
            });

            ul.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.textContent = "No participants yet";
          li.className = "participant empty";
          ul.appendChild(li);
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // update activity card live without full reload
        let activityCard = null;
        document.querySelectorAll('.activity-card').forEach((c) => {
          if (c.dataset.activity === activity) activityCard = c;
        });

        if (activityCard) {
          const ul = activityCard.querySelector('.participants-list');

          // remove placeholder if present
          const placeholder = ul.querySelector('.participant.empty');
          if (placeholder) placeholder.remove();

          // create new participant list item with delete button
          const li = document.createElement('li');
          li.className = 'participant';
          li.innerHTML = `
            <span class="participant-email">${email}</span>
            <button class="remove-participant" aria-label="Remove participant">✖</button>
          `;

          const btn = li.querySelector('.remove-participant');
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
              const resp = await fetch(
                `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
                { method: 'DELETE' }
              );
              const res = await resp.json();
              if (resp.ok) {
                li.remove();
                // update availability
                const count = activityCard.querySelectorAll('.participants-list .participant:not(.empty)').length;
                const max = parseInt(activityCard.dataset.max, 10) || 0;
                const avail = activityCard.querySelector('.availability');
                avail.innerHTML = `<strong>Availability:</strong> ${max - count} spots left`;

                if (count === 0) {
                  const emptyLi = document.createElement('li');
                  emptyLi.textContent = 'No participants yet';
                  emptyLi.className = 'participant empty';
                  ul.appendChild(emptyLi);
                }

                messageDiv.textContent = res.message || 'Unregistered participant';
                messageDiv.className = 'success';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 4000);
              } else {
                messageDiv.textContent = res.detail || 'Failed to unregister';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }
            } catch (err) {
              console.error('Error unregistering:', err);
            }
          });

          ul.appendChild(li);

          // update availability after adding
          const countAfter = activityCard.querySelectorAll('.participants-list .participant:not(.empty)').length;
          const max = parseInt(activityCard.dataset.max, 10) || 0;
          const avail = activityCard.querySelector('.availability');
          avail.innerHTML = `<strong>Availability:</strong> ${max - countAfter} spots left`;
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
