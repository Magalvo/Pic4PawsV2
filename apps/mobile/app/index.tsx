import { Text, View } from 'react-native';
import { productName } from '@pic4paws/domain';

export default function IndexScreen() {
  return (
    <View>
      <Text>{productName}</Text>
      <Text>Experiencia mobile para adotantes e padrinhos.</Text>
    </View>
  );
}
