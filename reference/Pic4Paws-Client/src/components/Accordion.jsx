import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import AddIconModule from '@mui/icons-material/Add';
import PetForm from '../pages/widgets/PetForm';
import { resolveComponent } from '../utils/componentInterop.js';

const AddIcon = resolveComponent(AddIconModule);

export default function FormAccordion({ refreshList }) {
  return (
    <div>
      <Accordion>
        <AccordionSummary
          expandIcon={<AddIcon />}
          aria-controls='panel1a-content'
          id='panel1a-header'
        >
          <Typography align='center'>Create a New 4 Paws</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <PetForm refreshList={refreshList} />
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
