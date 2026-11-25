import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";

/**
 * Renders the whole app as if the browser had opened `path`.
 * Screen tests go through the real routes, so redirects and navigation are tested too.
 * Each test file mocks "../api/auth" itself, so no request leaves the test.
 */
export function renderApp(path: string) {
  const user = userEvent.setup();
  const utils = render(<App initialEntries={[path]} />);
  return { user, ...utils };
}

export const gustavo = {
  id: "u1",
  name: "Gustavo Levin",
  email: "gus@mail.com",
  username: "gustavo.levin",
};
