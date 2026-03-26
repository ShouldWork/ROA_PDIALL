import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function submitSuggestion({ manufacturer, category, subcategory, itemText, suggestedBy }) {
  await addDoc(collection(db, 'suggested_template_items'), {
    manufacturer,
    category:    category.trim(),
    subcategory: subcategory.trim(),
    itemText:    itemText.trim(),
    suggestedBy,
    status:      'pending',
    reviewedBy:  null,
    reviewedAt:  null,
    notes:       '',
    createdAt:   serverTimestamp(),
  });
}
