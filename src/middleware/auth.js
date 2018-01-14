export const bearer = (request, response, next) => {
  try {
    const { authorization } = request.headers;
    request.bearer = authorization.split('Bearer ')[1];
  } catch (e) {
    return response.sendStatus(403);
  }
  next();
}

export const hasSessionToken = (request, response, next) => {
  bearer(request, response, () => {
    const session = request.headers['x-session'];
    if (!session) {
      return response.send(403, 'sessionToken missing or expired');
    }
    request.session = session;
    next();
  });
}
