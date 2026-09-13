import '../models/item.dart';
import 'api_client.dart';

class ItemService {
  ItemService._();
  static final instance = ItemService._();

  Future<List<Item>> list({String? search}) async {
    final data = await ApiClient.instance.get<List<dynamic>>('/items', queryParameters: {
      'status': 'ACTIVE',
      if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
    });
    return data.map((e) => Item.fromJson(e as Map<String, dynamic>)).toList();
  }
}
