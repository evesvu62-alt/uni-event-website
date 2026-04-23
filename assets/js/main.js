// app boot
document.addEventListener("DOMContentLoaded", function () {
	loadLayout().finally(function () {
		initMode();
		initTopBtn();
		initForm();
		initFilter();
		initEventsToolbar();
		initEventDetailLinks();
		initEventDetailsFromQuery();
		initEventActions();
	});
});

// nav and footer
function loadLayout() {
	var navBox = document.getElementById("app-nav");
	var footBox = document.getElementById("app-footer");
	var ok = !!(navBox || footBox);
    // if no nav or footer, skip loading layout
	if (!ok) {
		return Promise.resolve();
	}
    // fetch layout file and insert into page
	return fetch("assets/partials/layout.html")
		.then(function (r) {
			if (!r.ok) {
				throw new Error("layout file not found");
			}
			return r.text();
		})
		.then(function (txt) {
			var p = new DOMParser();
			var d = p.parseFromString(txt, "text/html");
			var navTmp = d.getElementById("nav-template");
			var footTmp = d.getElementById("foot-template");
            // insert nav and footer if they exist in layout
			if (navBox && navTmp) {
				navBox.innerHTML = navTmp.innerHTML;
			}

			if (footBox && footTmp) {
				footBox.innerHTML = footTmp.innerHTML;
			}
		})
		.catch(function () {
			if (navBox) {
				navBox.innerHTML = "";
			}
			if (footBox) {
				footBox.innerHTML = "";
			}
		});
}

// dark mode
function initMode() {
	var b = document.body;
	var mBtn = document.getElementById("mode-btn");
	var mIcon = document.getElementById("mode-icon");
	var mode = localStorage.getItem("mode");
	// default dark unless light is saved
	if (mode === "light") {
		b.classList.remove("dark-mode");
	} else {
		b.classList.add("dark-mode");
	}

	updateIcon(mIcon);
    // toggle mode on button click and save preference to localStorage
	if (mBtn) {
		mBtn.addEventListener("click", function () {
			b.classList.toggle("dark-mode");
			if (b.classList.contains("dark-mode")) {
				localStorage.setItem("mode", "dark");
			} else {
				localStorage.setItem("mode", "light");
			}
			updateIcon(mIcon);
		});
	}
}

// icon state
function updateIcon(i) {
	if (!i) {
		return;
	}
    // update icon based on current mode
	if (document.body.classList.contains("dark-mode")) {
		i.className = "bi bi-sun-fill";
	} else {
		i.className = "bi bi-moon-fill";
	}
}

// back to top button
function initTopBtn() {
	var topBtn = document.getElementById("top-btn");

	if (!topBtn) {
		return;
	}

	window.addEventListener("scroll", function () {
		// show button after scrolling down 300px
		if (window.scrollY > 300) {
			topBtn.classList.add("show");
		} else {
			topBtn.classList.remove("show");
		}
	});

	topBtn.addEventListener("click", function () {
		window.scrollTo({ top: 0, behavior: "smooth" });
	});
}

// form check
function initForm() {
	var form = document.getElementById("contact-form");
	var msgBox = document.getElementById("form-msg");
	var name = document.getElementById("name");
	var email = document.getElementById("email");
	var msg = document.getElementById("message");
	var mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	var nameOk = /^[A-Za-z][A-Za-z\s.'-]*$/;
	var messageOk = /^[A-Za-z0-9\s.,!?;:'"()\-_/&@#+=\r\n]*$/;

	if (!form || !msgBox) {
		return;
	}

	function setFieldState(field, isValid) {
		if (!field) {
			return;
		}

		field.classList.toggle("is-valid", isValid);
		field.classList.toggle("is-invalid", !isValid);
	}

	function getFieldMessage(field) {
		if (!field) {
			return "";
		}

		if (field.id === "name") {
			return "Name must be at least 6 characters and use letters, spaces, apostrophes, periods only";
		}

		if (field.id === "email") {
			return "Please enter a valid email address";
		}

		if (field.id === "message") {
			return "Message must be at least 20 characters and use allowed characters only";
		}

		return "Please fill out this field";
	}

	function validateField(field, showFeedback) {
		if (!field) {
			return true;
		}

		var value = field.value.trim();
		var valid = !!value;

		// name must be at least 6 chars and only contain letters, spaces, apostrophes, periods
		if (field.id === "name") {
			valid = value.length >= 6 && nameOk.test(value);
		}
		// email must match basic email pattern
		if (field.id === "email") {
			valid = !!value && mailOk.test(value);
		}
		// message must be at least 20 chars and only contain allowed characters
		if (field.id === "message") {
			valid = value.length >= 20 && messageOk.test(value);
		}

		setFieldState(field, valid);

		if (showFeedback && !valid) {
			msgBox.innerHTML = '<div class="alert alert-danger mb-0" role="alert">' + getFieldMessage(field) + '</div>';
		}

		return valid;
	}

	function clearMessage() {
		msgBox.innerHTML = "";
	}

	if (name) {
		name.addEventListener("blur", function () {
			validateField(name, true);
		});

		name.addEventListener("input", function () {
			validateField(name, false);
		});
	}

	if (email) {
		email.addEventListener("blur", function () {
			validateField(email, true);
		});

		email.addEventListener("input", function () {
			validateField(email, false);
		});
	}

	if (msg) {
		msg.addEventListener("blur", function () {
			validateField(msg, true);
		});

		msg.addEventListener("input", function () {
			validateField(msg, false);
		});
	}

	// on form submit, validate all fields and show success message if valid
	form.addEventListener("submit", function (e) {
		e.preventDefault();
		clearMessage();

		var isNameOk = validateField(name, true);
		var isEmailOk = validateField(email, true);
		var isMsgOk = validateField(msg, true);

		if (!isNameOk || !isEmailOk || !isMsgOk) {
			return;
		}

		msgBox.innerHTML = '<div class="alert alert-success" role="alert">Message sent successfully.</div>';
		form.reset();
		setFieldState(name, true);
		setFieldState(email, true);
		setFieldState(msg, true);
	});
}

// category filter
function initFilter() {
	var listBtn = document.querySelectorAll(".cat-btn");
	var listCard = document.querySelectorAll(".event-item");
    // if no buttons or cards, skip filter initialization
	if (!listBtn.length || !listCard.length) {
		return;
	}
    // add click event to each category button to filter event cards
	listBtn.forEach(function (oneBtn) {
		oneBtn.addEventListener("click", function () {
			var type = oneBtn.getAttribute("data-cat");

			listBtn.forEach(function (b) {
				b.classList.remove("active");
			});
			oneBtn.classList.add("active");

			listCard.forEach(function (box) {
				if (type === "all" || box.getAttribute("data-cat") === type) {
					box.style.display = "block";
				} else {
					box.style.display = "none";
				}
			});
		});
	});
}

// events page toolbar filter
function initEventsToolbar() {
	var searchInput = document.getElementById("searchEvent");
	var dateInput = document.getElementById("filterDate");
	var categoryInput = document.getElementById("filterCategory");
	var locationInput = document.getElementById("filterLocation");
	var resetBtn = document.getElementById("resetFilters");
	var cards = document.querySelectorAll("#events-grid .event-col");
	var emptyState = document.getElementById("events-empty");

	if (!searchInput || !dateInput || !categoryInput || !locationInput || !cards.length) {
		return;
	}

	function txt(v) {
		return (v || "").toLowerCase().trim();
	}

	function applyFilters() {
		var query = txt(searchInput.value);
		var selectedDate = dateInput.value;
		var selectedCategory = txt(categoryInput.value);
		var selectedLocation = txt(locationInput.value);
		var shownCount = 0;

		cards.forEach(function (item) {
			var cardTitle = txt((item.querySelector(".card-title") || {}).textContent);
			var cardDesc = txt((item.querySelector(".card-text:last-of-type") || {}).textContent);
			var cardCat = txt(item.getAttribute("data-cat"));
			var cardDate = item.getAttribute("data-date") || "";
			var cardLocation = txt(item.getAttribute("data-location"));

			var matchSearch = !query || (cardTitle + " " + cardDesc).indexOf(query) !== -1;
			var matchDate = !selectedDate || cardDate === selectedDate;
			var matchCategory = !selectedCategory || cardCat === selectedCategory;
			var matchLocation = !selectedLocation || cardLocation === selectedLocation;
			var show = matchSearch && matchDate && matchCategory && matchLocation;

			item.style.display = show ? "" : "none";
			if (show) {
				shownCount += 1;
			}
		});

		if (emptyState) {
			emptyState.classList.toggle("d-none", shownCount !== 0);
		}
	}

	searchInput.addEventListener("input", applyFilters);
	dateInput.addEventListener("change", applyFilters);
	categoryInput.addEventListener("change", applyFilters);
	locationInput.addEventListener("change", applyFilters);

	if (resetBtn) {
		resetBtn.addEventListener("click", function () {
			searchInput.value = "";
			dateInput.value = "";
			categoryInput.value = "";
			locationInput.value = "";
			applyFilters();
		});
	}

	applyFilters();
}

// build query string links for event details page from cards
function initEventDetailLinks() {
	var eventCards = document.querySelectorAll("#events-grid .event-col, #event-grid .event-item, #related-events .related-event-col");

	if (!eventCards.length) {
		return;
	}

	eventCards.forEach(function (card) {
		var detailsBtn = card.querySelector('a[href^="event.html"]');
		var titleEl = card.querySelector(".card-title");
		if (!titleEl) {
			titleEl = card.querySelector(".h6");
		}
		var descEl = card.querySelector(".card-text:last-of-type");
		var dateEl = card.querySelector(".card-text.mb-1");
		var locationEl = card.querySelector(".card-text.mb-2");
		var badgeEl = card.querySelector(".badge");
		var imageEl = card.querySelector("img");

		if (!detailsBtn || !titleEl) {
			return;
		}

		var params = new URLSearchParams();
		params.set("title", titleEl.textContent.trim());
		params.set("description", descEl ? descEl.textContent.trim() : card.getAttribute("data-description") || "");
		params.set("date", dateEl ? dateEl.textContent.trim() : card.getAttribute("data-date") || "");
		params.set("dateIso", card.getAttribute("data-date") || "");
		params.set("location", locationEl ? locationEl.textContent.trim() : card.getAttribute("data-location") || "");
		params.set("category", badgeEl ? badgeEl.textContent.trim() : card.getAttribute("data-cat") || "");
		params.set("image", imageEl ? imageEl.getAttribute("src") || "" : "");

		detailsBtn.href = "event.html?" + params.toString();
	});
}

// render event details page from query-string data
function initEventDetailsFromQuery() {
	var titleEl = document.getElementById("eventTitle");
	var introEl = document.getElementById("eventIntro");
	var mainImageEl = document.getElementById("eventMainImage");
	var dateEl = document.getElementById("eventDate");
	var locationEl = document.getElementById("eventLocation");
	var categoryEl = document.getElementById("eventCategory");
	var bookingEl = document.getElementById("bookingMessage");
	var calendarBtn = document.getElementById("eventCalendarBtn");

	if (!titleEl) {
		return;
	}

	var params = new URLSearchParams(window.location.search);
	var title = (params.get("title") || "").trim();

	if (!title) {
		return;
	}

	var description = (params.get("description") || "").trim();
	var dateText = (params.get("date") || "").trim();
	var locationText = (params.get("location") || "").trim();
	var categoryText = (params.get("category") || "").trim();
	var dateIso = (params.get("dateIso") || "").trim();
	var imageSrc = (params.get("image") || "").trim();

	titleEl.textContent = title;
	document.title = title + " - Event Details";

	if (mainImageEl && imageSrc) {
		mainImageEl.src = imageSrc;
		mainImageEl.alt = title + " image";
	}

	if (introEl && description) {
		introEl.textContent = description;
	}

	if (dateEl && dateText) {
		dateEl.innerHTML = '<i class="bi bi-calendar-event me-2"></i>' + dateText;
	}

	if (locationEl && locationText) {
		locationEl.innerHTML = '<i class="bi bi-geo-alt me-2"></i>' + locationText;
	}

	if (categoryEl && categoryText) {
		categoryEl.textContent = categoryText;
	}

	// Keep only related cards that match current category and are not the same event.
	var relatedCards = document.querySelectorAll("#related-events .related-event-col");
	if (relatedCards.length) {
		var visibleCount = 0;
		relatedCards.forEach(function (card) {
			var relCat = (card.getAttribute("data-cat") || "").toLowerCase();
			var relTitleEl = card.querySelector(".h6");
			var relTitle = relTitleEl ? relTitleEl.textContent.trim().toLowerCase() : "";
			var shouldShow = (!categoryText || relCat === categoryText.toLowerCase()) && relTitle !== title.toLowerCase();
			card.style.display = shouldShow ? "" : "none";
			if (shouldShow) {
				visibleCount += 1;
			}
		});

		if (!visibleCount) {
			relatedCards.forEach(function (card) {
				card.style.display = "";
			});
		}
	}

	if (bookingEl) {
		bookingEl.textContent = "Your seat has been reserved for " + title + ". Please check your email for confirmation details.";
	}

	if (calendarBtn) {
		var calDate = dateIso ? dateIso.replace(/-/g, "") : "20260508";
		var calHref =
			"https://calendar.google.com/calendar/render?action=TEMPLATE" +
			"&text=" + encodeURIComponent(title) +
			"&dates=" + calDate + "T150000/" + calDate + "T170000" +
			"&details=" + encodeURIComponent(description || "University event") +
			"&location=" + encodeURIComponent(locationText || "University Campus");

		calendarBtn.href = calHref;
	}
}

// single event page actions
function initEventActions() {
	var shareBtn = document.getElementById("shareEventBtn");
	var toastEl = document.getElementById("shareToast");
	var toastText = document.getElementById("shareToastText");

	if (!shareBtn) {
		return;
	}

	function showShareToast(msg) {
		if (toastText) {
			toastText.textContent = msg;
		}

		if (toastEl && window.bootstrap && window.bootstrap.Toast) {
			var toast = new window.bootstrap.Toast(toastEl);
			toast.show();
		}
	}

	shareBtn.addEventListener("click", function () {
		var link = window.location.href;

		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard
				.writeText(link)
				.then(function () {
					showShareToast("Event link copied to clipboard.");
				})
				.catch(function () {
					showShareToast("Unable to copy link automatically.");
				});
			return;
		}

		showShareToast("Copy this link from the address bar");
	});
}
