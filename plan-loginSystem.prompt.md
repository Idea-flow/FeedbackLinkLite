# Login System Implementation Plan

## 1. Backend Implementation

### 1.1 Configuration (`FeedbackProperties.java`)
- Modify `com.ideaflow.feedbacklinklite.config.FeedbackProperties` to include `Auth` configuration.
- Fields: `username`, `password`, `token` (the expected cookie value).
- Update `application.yml` with default/placeholder values.

### 1.2 Login Controller (`LoginController.java`)
- Create `com.ideaflow.feedbacklinklite.controller.LoginController`.
- Annotate with `@RestController`.
- Endpoint: `@PostMapping("/login")`.
- Logic:
    - Receive `LoginRequest` (username, password).
    - Validate against `FeedbackProperties` auth config.
    - If valid, return `ResponseEntity.ok(auth_token)`.
    - If invalid, return `ResponseEntity.status(401).build()`.

### 1.3 Authentication Interceptor (`AuthInterceptor.java`)
- Create `com.ideaflow.feedbacklinklite.interceptor.AuthInterceptor`.
- Implement `HandlerInterceptor`.
- Override `preHandle`:
    - Retrieve `auth` cookie from request.
    - Compare value with `FeedbackProperties` auth token.
    - If match, return `true`.
    - If mismatch, set response 401 and return `false`.

### 1.4 Web Configuration (`WebConfig.java`)
- Create `com.ideaflow.feedbacklinklite.config.WebConfig`.
- Implement `WebMvcConfigurer`.
- Override `addInterceptors`:
    - Add `AuthInterceptor`.
    - Path patterns: `/api/config/**`.

## 2. Frontend Implementation (Nuxt)

### 2.1 Login Page (`pages/login.vue`)
- Create `nuxt-frontend/pages/login.vue`.
- Template:
    - Form with username and password fields.
    - Login button.
- Script:
    - `login` function:
        - Call `POST /login` with credentials.
        - On success:
            - `const auth = useCookie('auth')`.
            - `auth.value = response.token`.
            - Redirect to query param `redirect` or `/`.
        - On error: Show error message.

### 2.2 Auth Protection (`pages/index.vue`)
- Modify `nuxt-frontend/pages/index.vue`.
- Script:
    - Check `useCookie('auth')`.
    - If no value:
        - `navigateTo('/login?redirect=' + route.fullPath)`.

### 2.3 API Interceptor
- Create `nuxt-frontend/plugins/api-interceptor.ts`.
- Use `addPlugin` to define a global fetch interceptor? Or just wrap the call?
- Nuxt 3 allows defining `nitro` plugins for server or just client side `interceptors` in fetch.
- We will creation a plugin `plugins/auth-interceptor.ts` that uses `addRouteMiddleware` or intercepts `useFetch` if possible?
- Actually, the easiest way in Nuxt 3 to "intercept" all requests is often ensuring we use a custom composable `useApi` or similar.
- But if we stick to the user's specific request: "intercept /api/config ... verify failure ... jump to login".  We can add a global `onError` handler or a plugin that intercepts 401 responses.

