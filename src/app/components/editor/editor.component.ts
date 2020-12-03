
import {Component, OnInit, ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { take } from 'rxjs/operators';
import MediumEditor from 'medium-editor';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit, AfterViewInit {

  constructor(
    public authService: AuthService,
  ) { }

  @ViewChild('medium') media: ElementRef;
  ngAfterViewInit() {
    const edit = this.media.nativeElement;
    let editor;

    let textCollection = this.authService.GetText().pipe(take(1)).subscribe(val => {
      let placeholder = '';
      if (!val || val.length == 0) {
        placeholder = 'Type some text';
      }
      edit.innerHTML = val;
      const editor = new MediumEditor(edit, {
        placeholder: {
          text: placeholder
        }
      });

      editor.subscribe('editableInput', (eventObj, editable) => {
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, edit]);
        var content = editor.getContent();
        this.authService.UpdateText(content);
      });
    });
  }

  ngOnInit() { }
}
