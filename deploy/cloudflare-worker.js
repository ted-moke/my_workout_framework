// Cloudflare Worker that serves workout.themokes.org from Cloud Run.
//
// Cloud Run routes requests by Host header, so a plain proxied CNAME to
// *.run.app returns 404 (overriding the Host header needs Cloudflare
// Enterprise). This Worker forwards each request to the run.app URL instead.
//
// Set RUN_HOST (a plain-text variable on the Worker) to the service's host,
// e.g. workout-tracker-abc123-ue.a.run.app. See DEPLOY.md, "Cutover".
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    url.hostname = env.RUN_HOST;
    url.protocol = "https:";
    url.port = "";
    return fetch(new Request(url, request));
  },
};
