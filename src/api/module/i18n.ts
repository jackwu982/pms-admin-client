const messages = Object.fromEntries(
  Object.entries(import.meta.glob<any>('../../../locales/*.ts', { eager: true })).map(
    ([key, value]) => {
      return [key.slice(17, -3), value.default]
    },
  ),
)
export default messages
