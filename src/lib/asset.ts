/** Prefix a public/ path with the deploy base ("/" locally, "/portfolio/" on GitHub Pages). */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
