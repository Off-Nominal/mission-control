import { Providers } from "../../providers";

export default function NotificationsSetter({ helperBot }: Providers) {}

// .addSubcommand((command) =>
// command
//   .setName("subscribe")
//   .setDescription("Get notifications about new Discord events.")
//   .addBooleanOption((option) =>
//     option
//       .setName("new-event")
//       .setDescription("Get notified when a new event is created")
//   )
//   .addIntegerOption((option) =>
//     option
//       .setName("pre-event")
//       .setDescription(
//         "Get notified before event starts (give us a number in minutes before the event starts)"
//       )
//       .setMaxValue(1440)
//       .setMinValue(5)
//   )
// )
// .addSubcommand((command) =>
// command
//   .setName("unsubscribe")
//   .setDescription(
//     "Unsubscribe from all future automatic event notifications."
//   )
// )
