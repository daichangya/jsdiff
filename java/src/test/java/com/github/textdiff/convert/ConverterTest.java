package com.github.textdiff.convert;

import com.github.textdiff.convert.DmpConverter.DmpOperation;
import com.github.textdiff.diff.CharacterDiff;
import com.github.textdiff.model.ChangeObject;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 转换器单元测试
 */
public class ConverterTest {
    
    @Test
    public void testConvertToDMP() {
        List<ChangeObject<String>> changes = CharacterDiff.diffChars("abc", "adc");
        List<DmpOperation<String>> dmp = DmpConverter.convertChangesToDMP(changes);
        
        assertThat(dmp).hasSize(4);
        assertThat(dmp.get(0).getOperation()).isEqualTo(0);  // 'a' unchanged
        assertThat(dmp.get(1).getOperation()).isEqualTo(-1); // 'b' removed
        assertThat(dmp.get(2).getOperation()).isEqualTo(1);  // 'd' added
        assertThat(dmp.get(3).getOperation()).isEqualTo(0);  // 'c' unchanged
    }
    
    @Test
    public void testConvertToXML() {
        List<ChangeObject<String>> changes = CharacterDiff.diffChars("abc", "adc");
        String xml = XmlConverter.convertChangesToXML(changes);
        
        assertThat(xml).contains("a");
        assertThat(xml).contains("<del>b</del>");
        assertThat(xml).contains("<ins>d</ins>");
        assertThat(xml).contains("c");
    }
    
    @Test
    public void testXMLEscaping() {
        ChangeObject<String> change1 = new ChangeObject<>("<tag>", false, true, 1);
        ChangeObject<String> change2 = new ChangeObject<>("&amp;", true, false, 1);
        
        List<ChangeObject<String>> changes = new ArrayList<>();
        changes.add(change1);
        changes.add(change2);
        String xml = XmlConverter.convertChangesToXML(changes);
        
        assertThat(xml).contains("&lt;tag&gt;");
        assertThat(xml).contains("&amp;amp;");
    }
}

