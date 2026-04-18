class CoachMessage {
  const CoachMessage({
    required this.role,
    required this.text,
  });

  final String role;
  final String text;
}

class CoachView {
  const CoachView({
    required this.messages,
  });

  final List<CoachMessage> messages;

  factory CoachView.placeholder() {
    return const CoachView(
      messages: [
        CoachMessage(
          role: 'coach',
          text: 'You are training well. Ask for a lighter variation, a hotel workout, or a faster session.',
        ),
      ],
    );
  }
}
