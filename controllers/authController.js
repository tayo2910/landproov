const supabase = require('../lib/supabase');

const SESSION_COOKIE = 'landproov_session';

async function signUp(email, password, phone, location, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone, location },
    },
  });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut(accessToken) {
  if (accessToken) {
    const { error } = await supabase.auth.admin.signOut(accessToken);
    if (error) console.error('Sign out error:', error);
  }
}

function setSessionCookie(res, session) {
  res.cookie(SESSION_COOKIE, JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365 * 1000,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

function getSessionFromCookie(req) {
  try {
    const raw = req.cookies[SESSION_COOKIE];
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function forgotPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.BASE_URL || 'http://localhost:3000'}/login`,
  });
  if (error) throw error;
  return data;
}

async function getUserFromSession(req, res) {
  const sessionData = getSessionFromCookie(req);
  if (!sessionData) return null;

  const { data, error } = await supabase.auth.setSession({
    access_token: sessionData.access_token,
    refresh_token: sessionData.refresh_token,
  });

  if (error || !data.user) {
    if (res) clearSessionCookie(res);
    return null;
  }

  return data.user;
}

module.exports = {
  signUp,
  signIn,
  signOut,
  forgotPassword,
  setSessionCookie,
  clearSessionCookie,
  getUserFromSession,
  SESSION_COOKIE,
};
