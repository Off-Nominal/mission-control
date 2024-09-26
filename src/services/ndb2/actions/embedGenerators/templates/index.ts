import { BaseMessageOptions } from "discord.js";
import {
  generateStandardViewComponents,
  generateStandardViewEmbed,
} from "./standard_view";
import { EmbedTemplateArgs, NDB2EmbedTemplate } from "./helpers/types";
import {
  generateRetirementNoticeComponents,
  generateRetireNoticeEmbed,
} from "./retire_notice";
import {
  generateTriggerNoticeComponents,
  generateTriggerNoticeEmbed,
} from "./trigger_notice";
import {
  generateSnoozeCheckComponents,
  generateSnoozeCheckEmbed,
} from "./snooze_check";
import {
  generateJudgementNoticeComponents,
  generateJudgementNoticeEmbed,
} from "./judgement_notice";
import {
  generateSeasonStartComponents,
  generateSeasonStartEmbed,
} from "./season_start";
import {
  generateSeasonEndComponents,
  generateSeasonEndEmbed,
} from "./season_end";
import {
  generateLeaderboardComponents,
  generateLeaderboardEmbed,
} from "./leaderboard";
import {
  generatePredictionListComponents,
  generatePredictionListEmbed,
} from "./prediction_list";
import {
  generatePredictionDetailsComponents,
  generatePredictionDetailsEmbed,
} from "./prediction_details";
import {
  generatePredictionEditComponents,
  generatePredictionEditEmbed,
} from "./prediction_edit";

export const generateInteractionReplyFromTemplate = (
  ...props: EmbedTemplateArgs
): [BaseMessageOptions["embeds"], BaseMessageOptions["components"]] => {
  const [template, args] = props;

  switch (template) {
    case NDB2EmbedTemplate.View.STANDARD: {
      const embeds = generateStandardViewEmbed(args);
      const components = generateStandardViewComponents(args.prediction);
      return [embeds, components];
    }
    case NDB2EmbedTemplate.View.RETIREMENT: {
      const embeds = generateRetireNoticeEmbed(args);
      const components = generateRetirementNoticeComponents(args.prediction.id);
      return [embeds, components];
    }
    case NDB2EmbedTemplate.View.TRIGGER: {
      const embeds = generateTriggerNoticeEmbed(args);
      const components = generateTriggerNoticeComponents(args.prediction.id);
      return [embeds, components];
    }
    case NDB2EmbedTemplate.View.SNOOZE_CHECK: {
      const embeds = generateSnoozeCheckEmbed(args);
      const components = generateSnoozeCheckComponents(args.prediction);
      return [embeds, components];
    }
    case NDB2EmbedTemplate.View.JUDGEMENT: {
      const embeds = generateJudgementNoticeEmbed(args);
      const components = generateJudgementNoticeComponents(args.prediction);
      return [embeds, components];
    }
    case NDB2EmbedTemplate.View.SEASON_START: {
      const embeds = generateSeasonStartEmbed(args);
      const components = generateSeasonStartComponents();
      return [embeds, components];
    }
    case NDB2EmbedTemplate.View.SEASON_END: {
      const embeds = generateSeasonEndEmbed(args);
      const components = generateSeasonEndComponents();
      return [embeds, components];
    }
    case NDB2EmbedTemplate.View.LEADERBOARD: {
      const embeds = generateLeaderboardEmbed(args);
      const components = generateLeaderboardComponents();
      return [embeds, components];
    }
    case NDB2EmbedTemplate.View.LIST: {
      const embeds = generatePredictionListEmbed(args);
      const components = generatePredictionListComponents();
      return [embeds, components];
    }
    case NDB2EmbedTemplate.View.DETAILS: {
      const embeds = generatePredictionDetailsEmbed(args);
      const components = generatePredictionDetailsComponents(
        args.prediction.id
      );
      return [embeds, components];
    }
    case NDB2EmbedTemplate.View.PREDICTION_EDIT: {
      const embeds = generatePredictionEditEmbed(args);
      const components = generatePredictionEditComponents(args.prediction.id);
      return [embeds, components];
    }
    default: {
      return [[], []];
    }
  }
};
