const symbols = (value: string) => value.split(" ");
export const emojiGroups: Record<string, string[]> = {
  "Faces & emotion": symbols(
    "😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😎 🤓 🧐 🤩 🥳 😏 😒 😞 😔 😢 😭 😤 😡 🤯 😳 🥺 😱 😴 🤖 👻 💀 👽 💩",
  ),
  "Hands & people": symbols(
    "👋 🤚 ✋ 🖖 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 👐 🤲 🤝 🙏 💪 🫶 👀 👁️ 🧠 🫀",
  ),
  "Animals & nature": symbols(
    "🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🦄 🐝 🦋 🐌 🐞 🐢 🐍 🦎 🐙 🦑 🦀 🐠 🐬 🐳 🌵 🌲 🌴 🌱 🌿 ☘️ 🍀 🎋 🍃 🍂 🍁 🌾 🌺 🌸 🌼 🌻 🌞 🌙 ⭐️ ✨ ⚡️ 🔥 🌈 🌊",
  ),
  "Food & objects": symbols(
    "🍎 🍊 🍋 🍉 🍇 🍓 🫐 🍒 🍑 🍍 🥝 🍅 🥑 🍕 🍔 🍟 🍩 🍪 🎂 ☕️ 🍺 🍷 ⚽️ 🏀 🎾 🎲 🎨 🎸 🎮 🚗 🚲 🚀 ✈️ ⌛️ ⏰ 💡 📷 📺 💻 ☎️ 🔑 🔨 🧲 💣 💎 💸 💌 💘 💖 💠",
  ),
  Symbols: symbols(
    "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 ☮️ ✝️ ☯️ ☸️ ✡️ 🔯 ♈️ ♉️ ♊️ ♋️ ♌️ ♍️ ♎️ ♏️ ♐️ ♑️ ♒️ ♓️ ▶️ ⏸️ ⏹️ ⏺️ ⏭️ ⏮️ ⏩ ⏪ 🔀 🔁 ➕ ➖ ✖️ ➗ ♾️ ❗️ ❓ 💯 ✅ ❌ ⭕️ 🔴 🟠 🟡 🟢 🔵 🟣 ⚫️ ⚪️ 🟤 🔶 🔷 🔸 🔹 ◼️ ◻️",
  ),
};

export const asciiGroups: Record<string, string[]> = {
  Letters: [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", ..."abcdefghijklmnopqrstuvwxyz"],
  Numbers: [..."0123456789"],
  Punctuation: Array.from("!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"),
  "Box drawing": Array.from("─│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬╭╮╯╰"),
  "Blocks & shades": Array.from("░▒▓█▀▄▌▐■□▪▫●○◆◇▲△▼▽"),
  "Math & arrows": Array.from("±×÷≈≠≤≥∞√∑∆π←↑→↓↔↕↖↗↘↙⇒⇔"),
};
