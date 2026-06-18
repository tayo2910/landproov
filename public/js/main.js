document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.mobile-toggle');
  var navLinks = document.querySelector('.nav-links');

  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
      toggle.classList.toggle('is-open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        toggle.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    });
  }

  var readMoreBtns = document.querySelectorAll('.read-more');
  readMoreBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var expanded = this.parentElement.querySelector('.card-expanded');
      if (expanded) {
        expanded.classList.toggle('open');
        this.textContent = expanded.classList.contains('open') ? 'Show less' : 'Read more';
      }
    });
  });

  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      var status = document.getElementById('formStatus');
      var btn = document.getElementById('submitBtn');

      status.style.display = 'none';
      status.className = 'form-status';
      btn.disabled = true;
      btn.textContent = 'Sending...';

      try {
        var data = {
          name: document.getElementById('name').value,
          email: document.getElementById('email').value,
          phone: (document.getElementById('phoneCode') ? document.getElementById('phoneCode').value : '') + document.getElementById('phone').value,
          location: document.getElementById('location').value,
          propertyLocation: document.getElementById('propertyLocation').value,
          service: document.getElementById('service').value,
          message: document.getElementById('message').value,
        };

        var res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        var result = await res.json();

        if (result.success) {
          status.className = 'form-status success';
          status.textContent = result.message;
          form.reset();
        } else {
          status.className = 'form-status error';
          status.textContent = result.errors
            ? result.errors.map(function (e) { return e.msg; }).join(', ')
            : result.message || 'Something went wrong.';
        }
      } catch (err) {
        status.className = 'form-status error';
        status.textContent = 'Network error. Please try again.';
      }

      status.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Send enquiry';
    });
  }

  function handleAuthForm(formId, endpoint, redirect) {
    var form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      var status = form.querySelector('#formStatus');
      var btn = form.querySelector('#submitBtn');

      status.style.display = 'none';
      status.className = 'form-status';
      btn.disabled = true;
      btn.textContent = 'Please wait...';

      try {
        var data = {
          email: document.getElementById('email').value,
          fullName: document.getElementById('fullName') ? document.getElementById('fullName').value : '',
          phone: (document.getElementById('phoneCode') ? document.getElementById('phoneCode').value : '') + (document.getElementById('phone') ? document.getElementById('phone').value : ''),
          location: document.getElementById('location') ? document.getElementById('location').value : '',
          password: document.getElementById('password').value,
          confirmPassword: document.getElementById('confirmPassword') ? document.getElementById('confirmPassword').value : '',
          agreeTerms: document.getElementById('agreeTerms') ? document.getElementById('agreeTerms').checked : false,
          recaptchaToken: (function(){ try { return document.querySelector('.g-recaptcha') ? grecaptcha.getResponse() : ''; } catch(e) { return ''; } })(),
        };

        var res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        var result = await res.json();

        if (result.success) {
          status.className = 'form-status success';
          status.textContent = result.message;
          var dest = result.redirect !== false ? redirect : '/login';
          if (dest) {
            setTimeout(function () { window.location.href = dest; }, 1000);
          }
        } else {
          status.className = 'form-status error';
          status.textContent = result.errors
            ? result.errors.map(function (e) { return e.msg; }).join(', ')
            : result.message || 'Something went wrong.';
        }
      } catch (err) {
        status.className = 'form-status error';
        status.textContent = 'Network error. Please try again.';
      }

      status.style.display = 'block';
      btn.disabled = false;
      btn.textContent = formId === 'signupForm' ? 'Create account' : formId === 'forgotPasswordForm' ? 'Send reset link' : 'Log in';
    });
  }

  var termsLink = document.getElementById('termsLink');
  var termsModal = document.getElementById('termsModal');
  var termsClose = document.getElementById('termsModalClose');
  var termsAccept = document.getElementById('termsModalAccept');
  var agreeTerms = document.getElementById('agreeTerms');
  var submitBtn = document.getElementById('submitBtn');

  if (agreeTerms && submitBtn) {
    agreeTerms.addEventListener('change', function () {
      submitBtn.disabled = !agreeTerms.checked;
    });
  }

  if (termsLink && termsModal) {
    function openTerms() {
      termsModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
    function closeTerms() {
      termsModal.style.display = 'none';
      document.body.style.overflow = '';
    }
    termsLink.addEventListener('click', function (e) { e.preventDefault(); openTerms(); });
    if (termsClose) termsClose.addEventListener('click', closeTerms);
    if (termsAccept) termsAccept.addEventListener('click', closeTerms);
    termsModal.addEventListener('click', function (e) {
      if (e.target === termsModal) closeTerms();
    });
  }

  handleAuthForm('signupForm', '/api/auth/signup', typeof NEXT_PAGE !== 'undefined' ? NEXT_PAGE : '/dashboard');
  handleAuthForm('loginForm', '/api/auth/login', '/dashboard');
  handleAuthForm('forgotPasswordForm', '/api/auth/forgot-password', null);

  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function (e) {
      e.preventDefault();
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    });
  }

  if (window.location.pathname === '/dashboard') {
    loadDashboardProfile();
    loadServices();
    setupServiceForm();
  }

  async function loadDashboardProfile() {
    try {
      var res = await fetch('/api/auth/session');
      var data = await res.json();
      if (data.authenticated && data.user) {
        var nameEl = document.getElementById('userDisplayName');
        var profileNameEl = document.getElementById('profileName');
        var name = (data.user.user_metadata && data.user.user_metadata.full_name) || data.user.email || 'Client';
        if (nameEl) nameEl.textContent = name;
        if (profileNameEl) profileNameEl.textContent = (data.user.user_metadata && data.user.user_metadata.full_name) || '';
      }
    } catch (e) {}
  }

  async function loadServices() {
    var list = document.getElementById('servicesList');
    var activeCountEl = document.getElementById('activeServiceCount');
    var completedCountEl = document.getElementById('completedServiceCount');
    if (!list) return;

    try {
      var res = await fetch('/api/user/services');
      var result = await res.json();

      if (!result.success) {
        list.innerHTML = '<p style="color:var(--gray);">Could not load services.</p>';
        return;
      }

      var services = result.services || [];
      var paidActive = services.filter(function (s) { return s.payment_status === 'paid' && (s.status === 'pending' || s.status === 'in_progress'); });
      var completed = services.filter(function (s) { return s.status === 'completed'; });

      if (activeCountEl) activeCountEl.textContent = paidActive.length;
      if (completedCountEl) completedCountEl.textContent = completed.length;

      if (services.length === 0) {
        list.innerHTML = '<p style="color:var(--gray);">No services yet. Use the form above to request one.</p>';
        return;
      }

      list.innerHTML = '';
      services.forEach(function (s) {
        var card = document.createElement('div');
        card.className = 'service-card-full';

        var created = new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        var amountFormatted = s.amount ? '$' + (s.amount / 100).toFixed(2) : '';

        if (s.payment_status === 'paid') {
          var statuses = ['pending', 'in_progress', 'completed'];
          var currentIdx = statuses.indexOf(s.status);
          if (currentIdx === -1) currentIdx = 0;
          var statusLabels = { pending: 'Requested', in_progress: 'In Progress', completed: 'Completed' };
          var statusColors = { pending: 'var(--gold)', in_progress: 'var(--forest)', completed: 'var(--green)' };

          card.innerHTML =
            '<div class="service-card-header">' +
              '<div>' +
                '<h3>' + s.service_type + '</h3>' +
                '<p class="service-card-location">' + s.property_location + '</p>' +
              '</div>' +
              '<span class="service-status" style="background:' + statusColors[s.status] + ';">' + statusLabels[s.status] + '</span>' +
            '</div>' +
            '<div class="service-progress">' +
              statuses.map(function (st, i) {
                var label = statusLabels[st];
                var isDone = i <= currentIdx;
                var isCurrent = i === currentIdx;
                return '<div class="progress-step' + (isDone ? ' done' : '') + (isCurrent ? ' current' : '') + '">' +
                  '<div class="progress-dot"></div>' +
                  '<span>' + label + '</span>' +
                '</div>';
              }).join('') +
            '</div>' +
            (s.notes ? '<p class="service-notes">' + s.notes + '</p>' : '') +
            '<p class="service-date">Requested ' + created + '</p>';
        } else {
          var payLabel = s.payment_status === 'failed' ? 'Payment failed' : 'Awaiting payment';
          card.innerHTML =
            '<div class="service-card-header">' +
              '<div>' +
                '<h3>' + s.service_type + '</h3>' +
                '<p class="service-card-location">' + s.property_location + '</p>' +
              '</div>' +
              '<span class="service-status" style="background:var(--gray);">' + payLabel + '</span>' +
            '</div>' +
            (s.notes ? '<p class="service-notes">' + s.notes + '</p>' : '') +
            '<p class="service-date">Requested ' + created + '</p>' +
            '<div style="margin-top:16px;">' +
              '<span style="font-weight:700;font-size:1.2rem;color:var(--forest);">' + amountFormatted + '</span>' +
            '</div>'
        }

        list.appendChild(card);
      });
    } catch (err) {
      list.innerHTML = '<p style="color:var(--gray);">Could not load services.</p>';
    }
  }

  function setupServiceForm() {
    var form = document.getElementById('serviceForm');
    if (!form) return;

    var serviceTypeEl = document.getElementById('serviceType');
    var priceDisplay = document.getElementById('priceDisplay');
    var paymentMethodEl = document.getElementById('paymentMethod');
    var paypalContainer = document.getElementById('paypal-button-container');
    var prices = { 'Land & Property Verification': 150, 'Land Registration, Survey & Documentation': 1800, 'Site Visits & Documentation': 300, 'Quantity Surveying': 300, 'Agent & Developer Meetings': 150, 'Project Monitoring': 500 };

    if (serviceTypeEl && priceDisplay) {
      serviceTypeEl.addEventListener('change', function () {
        var price = prices[serviceTypeEl.value];
        priceDisplay.textContent = price ? '$' + price.toFixed(2) : 'Select a service type to see the price';
      });
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      var status = document.getElementById('serviceFormStatus');
      var btn = document.getElementById('serviceSubmitBtn');

      status.style.display = 'none';
      status.className = 'form-status';
      btn.disabled = true;
      btn.textContent = 'Submitting...';

      try {
        var data = {
          serviceType: serviceTypeEl.value,
          propertyLocation: document.getElementById('propertyLocation').value,
          notes: document.getElementById('serviceNotes').value,
          paymentMethod: paymentMethodEl ? paymentMethodEl.value : 'paystack',
        };

        var res = await fetch('/api/user/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        var result = await res.json();

        if (result.success) {
          var serviceId = result.service ? result.service.id : null;
          var pm = result.paymentMethod || data.paymentMethod;

          if (pm === 'paystack' && result.access_code && PAYSTACK_PUBLIC_KEY) {
            status.className = 'form-status success';
            status.textContent = 'Service created! Opening payment...';
            status.style.display = 'block';
            form.reset();
            if (priceDisplay) priceDisplay.textContent = 'Select a service type to see the price';

            var handler = PaystackPop.setup({
              access_code: result.access_code,
              onClose: function () {
                status.textContent = 'Payment cancelled. You can pay later from your services list.';
                loadServices();
              },
              callback: function (transaction) {
                fetch('/api/payment/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ reference: transaction.reference, serviceId: serviceId }),
                }).then(function () {
                  status.textContent = 'Payment successful! Service is now active.';
                  loadServices();
                }).catch(function () {
                  status.textContent = 'Payment completed but verification pending.';
                  loadServices();
                });
              }
            });
            handler.openIframe();
          } else if (pm === 'flutterwave' && FW_PUBLIC_KEY) {
            status.className = 'form-status success';
            status.textContent = 'Service created! Opening payment...';
            status.style.display = 'block';
            form.reset();
            if (priceDisplay) priceDisplay.textContent = 'Select a service type to see the price';

            var amount = result.service ? result.service.amount / 100 : 0;
            FlutterwaveCheckout({
              public_key: FW_PUBLIC_KEY,
              tx_ref: 'lp-' + Date.now(),
              amount: amount,
              currency: 'USD',
              customer: { email: USER_EMAIL },
              callback: function (payment) {
                fetch('/api/flutterwave/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ transaction_id: payment.transaction_id, serviceId: serviceId }),
                }).then(function () {
                  status.textContent = 'Payment successful! Service is now active.';
                  loadServices();
                }).catch(function () {
                  status.textContent = 'Payment completed but verification pending.';
                  loadServices();
                });
              },
              onclose: function () {
                status.textContent = 'Payment cancelled. You can pay later from your services list.';
                loadServices();
              }
            });
          } else if (pm === 'paypal' && typeof paypal !== 'undefined') {
            status.className = 'form-status success';
            status.textContent = 'Service created! Please complete payment below.';
            status.style.display = 'block';
            form.reset();
            if (priceDisplay) priceDisplay.textContent = 'Select a service type to see the price';
            btn.style.display = 'none';
            if (paymentMethodEl) paymentMethodEl.style.display = 'none';

            paypalContainer.style.display = 'block';
            paypalContainer.innerHTML = '';

            try {
              var orderRes = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: result.service ? result.service.amount : 0, serviceId: serviceId }),
              });
              var orderData = await orderRes.json();
              if (!orderData.success) throw new Error(orderData.message);

              paypal.Buttons({
                createOrder: function () { return orderData.orderID; },
                onApprove: function (data) {
                  fetch('/api/paypal/capture-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderID: data.orderID, serviceId: serviceId }),
                  }).then(function (capRes) { return capRes.json(); }).then(function (capData) {
                    if (capData.success) status.textContent = 'Payment successful! Service is now active.';
                    else status.textContent = 'Payment could not be verified. Please contact support.';
                    paypalContainer.style.display = 'none';
                    btn.style.display = '';
                    if (paymentMethodEl) paymentMethodEl.style.display = '';
                    loadServices();
                  }).catch(function () {
                    status.textContent = 'Verification failed. Please contact support.';
                    paypalContainer.style.display = 'none';
                    btn.style.display = '';
                    if (paymentMethodEl) paymentMethodEl.style.display = '';
                    loadServices();
                  });
                },
                onCancel: function () {
                  status.textContent = 'Payment cancelled. You can pay later from your services list.';
                  paypalContainer.style.display = 'none';
                  btn.style.display = '';
                  if (paymentMethodEl) paymentMethodEl.style.display = '';
                  loadServices();
                },
              }).render('#paypal-button-container');
            } catch (ppErr) {
              status.className = 'form-status error';
              status.textContent = 'Could not initialize PayPal. Please try again.';
              paypalContainer.style.display = 'none';
              btn.style.display = '';
              if (paymentMethodEl) paymentMethodEl.style.display = '';
            }
          } else {
            status.className = 'form-status success';
            status.textContent = result.message;
            form.reset();
            if (priceDisplay) priceDisplay.textContent = 'Select a service type to see the price';
            loadServices();
          }
        } else {
          status.className = 'form-status error';
          status.textContent = result.errors
            ? result.errors.map(function (e) { return e.msg; }).join(', ')
            : result.message || 'Something went wrong.';
          status.style.display = 'block';
        }
      } catch (err) {
        status.className = 'form-status error';
        status.textContent = 'Network error. Please try again.';
        status.style.display = 'block';
      }

      btn.disabled = false;
      btn.textContent = 'Submit request';
    });
  }
});
