import Buttons from "../../../components/Buttons";
import notification from "../../../components/notification";
import WaitForElement from "../../../helpers/WaitForElement";
import WaitForObject from "../../../helpers/WaitForObject";
import Action from "../../../controllers/Req/Brainly/Action";

/**
 * Prepare and add quick delete buttons to answer boxes
 */
export default async function responseSection() {
  let buttonData = [];

  System.data.config.quickDeleteButtonsReasons.response.forEach(id => {
    let reason = System.data.Brainly.deleteReasons.__withIds.response[id];

    buttonData.push({
      text: reason.title,
      title: reason.text,
      type: "peach",
      icon: "x"
    });
  });

  let responseDeleteButtons = Buttons('RemoveQuestion', buttonData, `<li class="sg-list__element  sg-actions-list--to-right">{button}</li>`);

  let $responseModerateButtons = $(`
	<div class="sg-actions-list sg-actions-list--to-right sg-actions-list--no-wrap">
		<div class="sg-content-box" style="height: 0;">
			<ul class="sg-list ext_actions">
				${responseDeleteButtons}
			</ul>
		</div>
	</div>`);

  let cloneResponseModerateButtons = () => $responseModerateButtons.clone();
  cloneResponseModerateButtons().insertAfter(selectors.responseContainer + selectors.responseModerateButtonContainer);

  let _$_observe = await WaitForObject("$().observe");

  if (_$_observe) {
    let responseParentContainer = await WaitForElement(selectors.responseParentContainer);

    $(responseParentContainer).observe('added', 'div.js-answer-react', e => {
      cloneResponseModerateButtons().insertAfter($(selectors.responseContainer + selectors.responseModerateButtonContainer, e.addedNodes));
    });
  }

  let responseModerateButtonsClickHandler = async function() {
    let btn_index = $(this).parent().index();
    let parentResponseContainer = $(this).parents(selectors.responseContainer);
    let answer_id = Number(parentResponseContainer.data("answer-id"));
    let questionData = $(".js-main-question").data("z");
    let answer = questionData.responses.find(response => response.id == answer_id);
    let usersData = $(".js-users-data").data("z");
    let user = usersData[answer.userId];

    if (!answer_id) {
      Console.error("Cannot find the answer id");
    } else if (!user) {
      Console.error("Cannot find the user data");
    } else {
      if (confirm(System.data.locale.common.moderating.doYouWantToDelete)) {
        let reason = System.data.Brainly.deleteReasons.__withIds.response[System.data.config.quickDeleteButtonsReasons.response[btn_index]];
        let responseData = {
          model_id: answer_id,
          reason_id: reason.category_id,
          reason: reason.text
        };
        responseData.give_warning = System.canBeWarned(reason.id);
        let svg = $("svg", this);

        $(`<div class="sg-spinner sg-spinner--xxsmall sg-spinner--light"></div>`).insertBefore(svg);
        svg.remove();

        let res = await new Action().RemoveAnswer(responseData);
        await new Action().CloseModerationTicket(questionData.id);

        if (!res || !res.success) {
          notification((res && res.message) || System.data.locale.common.notificationMessages.somethingWentWrong, "error");
        } else {
          System.log(6, { user, data: [answer_id] });
          parentResponseContainer.addClass("brn-question--deleted");
          $(selectors.responseModerateButtonContainer, parentResponseContainer).remove();
          $responseModerateButtons.remove();
        }
      }
    }
  };
  $(selectors.responseParentContainer).on("click", selectors.responseContainer + " " + selectors.responseModerateButtonContainer + ":last-child button", responseModerateButtonsClickHandler);
}
