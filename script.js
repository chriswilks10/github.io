const header = document.getElementById("siteHeader");
const parallaxNodes = document.querySelectorAll("[data-parallax]");
const revealNodes = document.querySelectorAll(".reveal");
const accordionItems = document.querySelectorAll(".expertise-item");

const form = document.getElementById("contactForm");
const statusEl = document.getElementById("formStatus");
const captchaLabel = document.getElementById("captchaLabel");
const captchaInput = document.getElementById("captchaAnswer");
const thanks = document.getElementById("thankYouMessage");

let captchaA = 0;
let captchaB = 0;

function setCaptcha() {
  captchaA = Math.floor(Math.random() * 8) + 2;
  captchaB = Math.floor(Math.random() * 8) + 2;
  captchaLabel.textContent = `Security Check: What is ${captchaA} + ${captchaB}?`;
}

function setStatus(message, kind = "error") {
  statusEl.textContent = message;
  statusEl.classList.remove("success", "error");

  if (message) {
    statusEl.classList.add(kind);
  }
}

function handleScroll() {
  const y = window.scrollY || 0;

  if (header) {
    header.classList.toggle("scrolled", y > 14);
  }

  parallaxNodes.forEach((node, idx) => {
    const factor = idx === 0 ? 0.12 : 0.08;
    node.style.transform = `translate3d(0, ${y * factor}px, 0)`;
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  {
    threshold: 0.18,
  }
);

revealNodes.forEach((node) => observer.observe(node));
window.addEventListener("scroll", handleScroll, { passive: true });

let syncingAccordion = false;

function normalizeAccordionState() {
  const openItems = Array.from(accordionItems).filter((item) => item.open);

  if (openItems.length <= 1) {
    return;
  }

  openItems.slice(1).forEach((item) => {
    item.open = false;
  });
}

accordionItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (syncingAccordion || !item.open) {
      return;
    }

    syncingAccordion = true;
    accordionItems.forEach((otherItem) => {
      if (otherItem !== item) {
        otherItem.open = false;
      }
    });
    syncingAccordion = false;
  });
});

normalizeAccordionState();

if (form) {
  setCaptcha();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("");
    thanks.hidden = true;

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();
    const answer = Number.parseInt(captchaInput.value.trim(), 10);
    const submitButton = form.querySelector('button[type="submit"]');

    if (!name || !email || !message) {
      setStatus("Please complete all required fields.");
      return;
    }

    if (answer !== captchaA + captchaB) {
      setStatus("Security check failed. Please try again.");
      setCaptcha();
      captchaInput.value = "";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    const formData = new FormData(form);

    try {
      const response = await fetch("https://formsubmit.co/ajax/chriswilks10@gmail.com", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      let result = null;
      try {
        result = await response.json();
      } catch (jsonError) {
        result = null;
      }

      const successFlag = result && (result.success === true || result.success === "true");

      if (!response.ok || !successFlag) {
        const providerMessage =
          result && (typeof result.message === "string" ? result.message : typeof result.error === "string" ? result.error : "");

        if (providerMessage && /verify|activate|confirmation|confirm/i.test(providerMessage)) {
          setStatus("One-time activation required. Check chriswilks10@gmail.com for FormSubmit confirmation email.");
        } else {
          setStatus(providerMessage || "Unable to deliver right now. Please try again.");
        }

        return;
      }

      setStatus("Message sent successfully.", "success");
      thanks.hidden = false;
      form.reset();
      setCaptcha();
    } catch (error) {
      setStatus("Primary send failed in this browser context. Opening fallback submission window.");

      const previousTarget = form.getAttribute("target");
      form.setAttribute("target", "_blank");
      form.submit();

      if (previousTarget === null) {
        form.removeAttribute("target");
      } else {
        form.setAttribute("target", previousTarget);
      }
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Send Message";
    }
  });
}

handleScroll();
