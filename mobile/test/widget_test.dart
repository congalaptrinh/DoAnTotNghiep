import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:wms_mobile/main.dart';

void main() {
  testWidgets('App khởi động và hiển thị tên thương hiệu', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: WmsApp()));

    expect(find.text('TechStore WMS'), findsOneWidget);
  });
}
